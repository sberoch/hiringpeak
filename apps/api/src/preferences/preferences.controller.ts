import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/auth.decorators';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { PreferencesService } from './preferences.service';

/**
 * The authenticated User's own preferences. No `@Permissions` (any End
 * User may manage their own) and no Audit Events.
 */
@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('Preferences')
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  /** Every saved layout, by layout key. Missing keys use the default. */
  @ApiOkResponse()
  @Get('layouts')
  async findLayouts(@CurrentUser() user: { id: string | number }) {
    return this.preferencesService.findLayouts(Number(user.id));
  }

  /** Saves one layout: the full ordered list of `{ key, visible }`. */
  @ApiBody({ schema: { type: 'array', items: { type: 'object' } } })
  @ApiOkResponse()
  @Put('layouts/:key')
  async saveLayout(
    @Param('key') key: string,
    @Body() value: unknown,
    @CurrentUser() user: { id: string | number },
  ) {
    return this.preferencesService.saveLayout(Number(user.id), key, value);
  }

  /** Resets one layout to the default. */
  @ApiNoContentResponse()
  @HttpCode(204)
  @Delete('layouts/:key')
  async removeLayout(
    @Param('key') key: string,
    @CurrentUser() user: { id: string | number },
  ) {
    await this.preferencesService.removeLayout(Number(user.id), key);
  }
}
