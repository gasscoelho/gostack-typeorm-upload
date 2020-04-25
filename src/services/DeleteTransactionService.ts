import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionsRepository = getRepository(Transaction);

    const checkTransactionIdExist = await transactionsRepository.findOne({
      where: { id },
    });

    // Check if ID Exist
    if (!checkTransactionIdExist) {
      throw new AppError('transaction not found.');
    }

    await transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;
