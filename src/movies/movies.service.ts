import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expires: number;
}

const TMDB_BASE = 'https://api.themoviedb.org/3';

// Allowed TMDB category endpoints (whitelist prevents path/SSRF injection
// via the user-supplied :type param).
const CATEGORY_MAP: Record<string, string> = {
  top_rated: 'top_rated',
  now_playing: 'now_playing',
  popular: 'popular',
  upcoming: 'upcoming',
};

@Injectable()
export class MoviesService {
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_CACHE_ENTRIES = 500;

  private categoriesCache: CacheEntry<any> | null = null;
  private cache = new Map<string, CacheEntry<any>>();

  private get apiKey(): string {
    const key = process.env.TMDB_API_KEY;
    if (!key) {
      throw new InternalServerErrorException('TMDB_API_KEY is not configured');
    }
    return key;
  }

  private getCached<T>(key: string): T | null {
    const hit = this.cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.value;
    if (hit) this.cache.delete(key);
    return null;
  }

  private setCached<T>(key: string, value: T) {
    // Bound memory: evict the oldest entry when over capacity.
    if (this.cache.size >= this.MAX_CACHE_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(key, { value, expires: Date.now() + this.CACHE_TTL_MS });
  }

  private async tmdbFetch(path: string, params: Record<string, string>) {
    const search = new URLSearchParams({
      api_key: this.apiKey,
      language: 'en-US',
      ...params,
    });
    const res = await fetch(`${TMDB_BASE}${path}?${search.toString()}`);
    if (!res.ok) {
      throw new InternalServerErrorException(
        `TMDB request failed (${res.status})`,
      );
    }
    return res.json();
  }

  private mapMovies(results: any[] = []) {
    return results.map((movie) => ({
      imdbID: String(movie.id),
      Title: movie.title,
      Year: movie.release_date ? movie.release_date.substring(0, 4) : 'N/A',
      Poster: movie.poster_path
        ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
        : 'https://dummyimage.com/200x300/2e2e2e/ffffff&text=No+Poster',
    }));
  }

  // Homepage category lists (mapped + cached together).
  async getCategories() {
    if (this.categoriesCache && this.categoriesCache.expires > Date.now()) {
      return this.categoriesCache.value;
    }

    const [topRated, nowPlaying, popular, upcoming] = await Promise.all([
      this.tmdbFetch('/movie/top_rated', { page: '1' }),
      this.tmdbFetch('/movie/now_playing', { page: '1' }),
      this.tmdbFetch('/movie/popular', { page: '1' }),
      this.tmdbFetch('/movie/upcoming', { page: '1' }),
    ]);

    const value = {
      topRated: this.mapMovies(topRated.results),
      nowPlaying: this.mapMovies(nowPlaying.results),
      popular: this.mapMovies(popular.results),
      upcoming: this.mapMovies(upcoming.results),
    };
    this.categoriesCache = {
      value,
      expires: Date.now() + this.CACHE_TTL_MS,
    };
    return value;
  }

  // Paginated category list (raw TMDB shape for infinite scroll).
  async getCategory(type: string, page: number) {
    const tmdbType = CATEGORY_MAP[type];
    if (!tmdbType) {
      throw new BadRequestException('Invalid category type');
    }
    const safePage = Math.min(500, Math.max(1, Math.floor(page) || 1));
    const cacheKey = `cat:${tmdbType}:${safePage}`;

    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const data = await this.tmdbFetch(`/movie/${tmdbType}`, {
      page: String(safePage),
    });
    this.setCached(cacheKey, data);
    return data;
  }

  // Movie search (raw TMDB shape).
  async search(query: string) {
    const q = (query || '').trim();
    if (!q) return { results: [] };
    const cacheKey = `search:${q.toLowerCase()}`;

    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const data = await this.tmdbFetch('/search/movie', {
      query: q,
      include_adult: 'false',
      page: '1',
    });
    this.setCached(cacheKey, data);
    return data;
  }

  // Movie details (raw TMDB shape, includes credits + videos).
  async getDetails(id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException('Invalid movie id');
    }
    const cacheKey = `details:${id}`;

    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const data = await this.tmdbFetch(`/movie/${id}`, {
      append_to_response: 'credits,videos',
    });
    this.setCached(cacheKey, data);
    return data;
  }
}
