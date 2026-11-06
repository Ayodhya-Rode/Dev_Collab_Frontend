export const githubLink = (url: string) =>
  url.startsWith("https://github.com/") ? url : undefined;

export const avatarSrc = (url: string | null) =>
  url && url.startsWith("https://avatars.githubusercontent.com/") ? url : undefined;