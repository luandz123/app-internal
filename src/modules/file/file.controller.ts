import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Get,
  Param,
  Res,
  Delete,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { cauHinhMulter } from './file.constants';
import { FileService } from './file.service';

@ApiTags('Tệp tin')
@ApiBearerAuth()
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Tải lên một tệp' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', cauHinhMulter))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không nhận được tệp');
    }

    return this.fileService.taoThongTinTep(file);
  }

  @Post('upload-multiple')
  @ApiOperation({ summary: 'Tải lên nhiều tệp (tối đa 5)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 5, cauHinhMulter))
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Không nhận được tệp nào');
    }

    return this.fileService.taoThongTinNhieuTep(files);
  }

  @Get(':filename')
  @ApiOperation({ summary: 'Tải hoặc xem tệp' })
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    const duongDan = this.fileService.layDuongDanTuyetDoi(filename);
    return res.sendFile(duongDan);
  }

  @Delete(':filename')
  @ApiOperation({ summary: 'Xóa tệp' })
  deleteFile(@Param('filename') filename: string) {
    this.fileService.xoaTep(filename);
    return { thongBao: 'Đã xóa tệp thành công' };
  }
}
