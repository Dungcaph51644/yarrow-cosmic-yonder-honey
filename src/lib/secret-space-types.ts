export type SecretCloudPhoto = {
  id: string;
  name: string;
  contentType: string;
  url: string;
  createdAt: number;
};

export type SecretDiaryEntry = {
  id: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

export type SecretDiaryDraft = {
  body: string;
  entryId: string | null;
  updatedAt: number;
} | null;

export type SecretDiaryData = {
  entries: SecretDiaryEntry[];
  draft: SecretDiaryDraft;
};

export type SharedSecretDiaryDraft = {
  body: string;
  entryId: string | null;
  updatedAt: number;
} | null;

export type SharedSecretDiaryData = {
  entries: SecretDiaryEntry[];
  draft: SharedSecretDiaryDraft;
};
