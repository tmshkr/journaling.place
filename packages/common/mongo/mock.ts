import { mockDeep } from "jest-mock-extended";
import { MongoClient } from "mongodb";

export const mongoMock = mockDeep<MongoClient>();

jest.mock("common/mongo/client", () => ({
  __esModule: true,
  mongoClient: mongoMock,
}));
