import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';

@ApiTags('auth')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('signin')
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Current authenticated user' })
  @Get('me')
  me(@CurrentUser() user: User) {
    return user;
  }
}
