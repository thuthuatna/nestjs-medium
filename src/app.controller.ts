import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Get hello message',
    description: 'Returns a greeting message from the application',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the greeting message',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Hello World!',
          description: 'The greeting message',
        },
      },
    },
  })
  getHello(): { message: string } {
    return this.appService.getHello();
  }
}
