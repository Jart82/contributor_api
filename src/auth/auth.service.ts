import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor() {
    // Passport serialization is now handled by the strategy
  }

  async validateUser(profile: any): Promise<any> {
    // User validation logic
    return profile;
  }
}