export interface JWTUser {
  userId: number;
}

export type AuthRequest = {
  user: JWTUser;
};
