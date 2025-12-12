import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../user/entities/user.entity';
import { CreateRegulationDto } from './dto/create-regulation.dto';
import { UpdateRegulationDto } from './dto/update-regulation.dto';
import { RegulationService } from './regulation.service';

@ApiTags('Quy định')
@ApiBearerAuth()
@Controller('regulations')
export class RegulationController {
  constructor(private readonly regulationService: RegulationService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo quy định mới (chỉ Admin)' })
  create(@Body() dto: CreateRegulationDto) {
    return this.regulationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách quy định đang áp dụng' })
  findActive() {
    return this.regulationService.findActive();
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Lấy toàn bộ quy định kể cả đã tắt (chỉ Admin)',
  })
  findAll() {
    return this.regulationService.findAll();
  }

  @Get('category')
  @ApiOperation({ summary: 'Lấy quy định theo danh mục' })
  @ApiQuery({ name: 'category', required: true, example: 'Thời gian làm việc' })
  findByCategory(@Query('category') category: string) {
    return this.regulationService.findByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết quy định' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.regulationService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật quy định (chỉ Admin)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRegulationDto,
  ) {
    return this.regulationService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xóa quy định (chỉ Admin)' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.regulationService.remove(id);
  }
}
