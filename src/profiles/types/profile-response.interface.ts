export interface IProfileResponse {
  profile: {
    email: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}
