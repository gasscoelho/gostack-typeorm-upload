import { Router } from 'express';

import { getCustomRepository } from 'typeorm';

import multer from 'multer';

import TransactionsRepository from '../repositories/TransactionsRepository';

import CreateTransactionService from '../services/CreateTransactionService';

import DeleteTransactionService from '../services/DeleteTransactionService';

import ImportTransactionsService from '../services/ImportTransactionsService';

import uploadConfig from '../config/uploadFile';

const uploadFile = multer(uploadConfig);

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionRepository.find({
    relations: ['category'],
  });

  const balance = await transactionRepository.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransactionService = new DeleteTransactionService();

  await deleteTransactionService.execute({ id });

  return response.json({ message: 'Transaction deleted.' });
});

transactionsRouter.post(
  '/import',
  uploadFile.single('file'),
  async (request, response) => {
    const importTransactionService = new ImportTransactionsService();

    const transactions = await importTransactionService.execute({
      filename: request.file.filename,
      originalName: request.file.originalname,
    });

    return response.json({ transactions });
  },
);

export default transactionsRouter;
