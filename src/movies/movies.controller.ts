import { Controller, Get, Param, Query } from '@nestjs/common';
import { MoviesService } from './movies.service';

// Public, cached proxy for TMDB. Keeps the API key on the server so it never
// ships in the browser bundle.
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  // Homepage category lists (mapped + cached).
  @Get('categories')
  async getCategories() {
    return this.moviesService.getCategories();
  }

  // Movie search.
  @Get('search')
  async search(@Query('q') q: string) {
    return this.moviesService.search(q);
  }

  // Paginated category list for infinite scroll.
  @Get('category/:type')
  async getCategory(
    @Param('type') type: string,
    @Query('page') page?: string,
  ) {
    return this.moviesService.getCategory(type, parseInt(page ?? '1', 10));
  }

  // Movie details (incl. credits + videos).
  @Get('details/:id')
  async getDetails(@Param('id') id: string) {
    return this.moviesService.getDetails(id);
  }
}
