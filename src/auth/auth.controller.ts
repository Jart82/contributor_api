import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedGuard } from './gaurds/auth.gaurd';


@Controller('auth')
export class AuthController {
  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin() {
    // Initiates GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubCallback(@Req() req, @Res() res) {
    // Successful authentication, redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }

  @Get('status')
  getStatus(@Req() req) {
    return {
      isAuthenticated: req.isAuthenticated(),
      user: req.user || null,
    };
  }

  @Get('logout')
  @UseGuards(AuthenticatedGuard)
  logout(@Req() req, @Res() res) {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: 'Logout failed' });
      res.json({ message: 'Logged out successfully' });
    });
  }
}