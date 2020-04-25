import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

import Category from '../models/Category';

import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category: categoryTitle,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionRepository);

    const categoryRepository = getRepository(Category);

    const { total } = await transactionsRepository.getBalance();

    // Check if type is income | outcome
    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('type must be income or outcome');
    }

    // Check the balance before create a new transaction
    if (type === 'outcome' && value > total) {
      throw new AppError(
        "It wasn't possible to create a new transaction. Please, check if you have enough credit before proceed with this action.",
      );
    }

    const checkCategoryExist = await categoryRepository.findOne({
      where: { title: categoryTitle },
    });

    let category_id = '';

    // Check if category already exist
    if (!checkCategoryExist) {
      const category = categoryRepository.create({
        title: categoryTitle,
      });

      await categoryRepository.save(category);

      category_id = category.id;
    } else {
      category_id = checkCategoryExist.id;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
