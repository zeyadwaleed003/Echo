type PostFileData = {
  id: number;
  url: string;
  createdAt: string;
};

export type GroupedPostFile = {
  postId: number;
  files: PostFileData[];
};
