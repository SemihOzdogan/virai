export type AppUser = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = LoginCredentials & {
  name: string;
};
