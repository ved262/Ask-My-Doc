export interface IAuthUser {
  _id: string;
  email: string;
}

export interface IAuthResponse {
  token: string;
  user: IAuthUser;
}