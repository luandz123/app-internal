import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../user/entities/user.entity';
import { CreateRegistrationPeriodDto } from './dto/create-registration-period.dto';
import { UpdateRegistrationPeriodDto } from './dto/update-registration-period.dto';
import { RegistrationPeriodService } from './registration-period.service';

@ApiTags('Kỳ đăng ký')
@ApiBearerAuth()
@Controller('registration-periods')
export class RegistrationPeriodController {
  constructor(private readonly periodService: RegistrationPeriodService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo kỳ đăng ký mới (chỉ Admin)' })
  create(@Body() dto: CreateRegistrationPeriodDto) {
    return this.periodService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách kỳ đăng ký' })
  findAll() {
    return this.periodService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Lấy các kỳ đăng ký đang mở' })
  findActive() {
    return this.periodService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết kỳ đăng ký' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.periodService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật kỳ đăng ký (chỉ Admin)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRegistrationPeriodDto,
  ) {
    return this.periodService.update(id, dto);
  }

  @Post(':id/lock')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Khóa kỳ đăng ký (chỉ Admin)' })
  lock(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.periodService.lock(id);
  }

  @Post(':id/close')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Đóng kỳ đăng ký (chỉ Admin)' })
  close(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.periodService.close(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xóa kỳ đăng ký (chỉ Admin)' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.periodService.remove(id);
  }
}
