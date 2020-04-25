import { promisify } from 'util';

import path from 'path';

import fs from 'fs';

import neatCsv from 'neat-csv';

import { getRepository, getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';

import Category from '../models/Category';

import uploadConfig from '../config/uploadFile';

import TransactionsRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';

const readFile = promisify(fs.readFile);

interface Request {
  filename: string;
  originalName: string;
}

class ImportTransactionsService {
  private allowedExts = ['csv'];

  async execute({ filename, originalName }: Request): Promise<Transaction[]> {
    const filePath = path.join(uploadConfig.directory, filename);

    const fileExtension = filename.substr(filename.lastIndexOf('.') + 1);

    // Check if extension is CSV
    if (!this.allowedExts.includes(fileExtension)) {
      throw new AppError(
        `${originalName} could not be uploaded. This file is invalid or not supported.\n\nAllowed types: ${this.allowedExts.join(
          ', ',
        )}`,
      );
    }

    // Get buffer from spreadsheet
    let data = await readFile(filePath, 'utf8');

    // Apply Trim (remove space between commas)
    data = data.replace(/\s*,\s*/g, ',');

    // Get transactions from the spreadsheet
    const transactions: Transaction[] = await neatCsv(data);

    // Transaction Custom Repository
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    // Category Repository
    const categoriesRepository = getRepository(Category);

    // Get Total Available
    let { total: totalAvailable } = await transactionsRepository.getBalance();

    const transactionCategories: string[] = [];

    // For each object, increase or decrease the totalAvailable and add the category type in the array
    transactions.forEach(transaction => {
      switch (transaction.type) {
        case 'income':
          totalAvailable += +transaction.value;
          break;
        case 'outcome':
          totalAvailable -= +transaction.value;
          break;
        default:
          break;
      }
      transactionCategories.push((transaction.category as unknown) as string);
    });

    // Check if totalAvailable is negative
    if (totalAvailable < 0) {
      throw new AppError(
        `It wasn't possible to proceed with the import. Check if your outcome value is not outnumbering the total available.`,
      );
    }

    // Get All Current Categories
    let currentCategories = await categoriesRepository.find();

    // Get an array of title attribute ['title1', 'title2', 'title3']
    const currentCategoriesTitle = currentCategories.map(
      category => category.title,
    );

    // Get only the categories which will need to be added in the database -- DISTINCT ['Others', 'Food']
    const categoriesToBeCreatedStringFormat = transactionCategories
      .filter(category => {
        return currentCategoriesTitle.indexOf(category) < 0;
      })
      .filter((value, index, self) => self.indexOf(value) === index);

    // Check if there are categories to be saved in the database
    if (categoriesToBeCreatedStringFormat.length !== 0) {
      // Transform string[] to Category[]
      const categoriesToBeCreatedCategoryFormat = categoriesToBeCreatedStringFormat.map(
        categoryTitle => {
          return categoriesRepository.create({
            title: categoryTitle,
          });
        },
      );

      // Update Category[] with the new categories
      currentCategories = currentCategories.concat(
        await categoriesRepository.save(categoriesToBeCreatedCategoryFormat),
      );
    }

    // Get an Array of transactions in a object format
    const transactionsToBeCreated = transactions.map(transaction => {
      return {
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category_id: currentCategories.find(
          category =>
            category.title === ((transaction.category as unknown) as string),
        )?.id,
      };
    });

    // Save the news transactions in the database
    await transactionsRepository.save(transactionsToBeCreated);

    // Remove file from tmp folder
    fs.promises.unlink(filePath);

    return transactions;
  }
}

export default ImportTransactionsService;
