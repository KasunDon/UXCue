import { IndexedDbRepository, type Repository } from "../storage/repository";

/** Single shared repository for the side panel (same IndexedDB origin as the SW). */
export const repo: Repository = new IndexedDbRepository();
