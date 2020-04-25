import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

import groupBy from '../utils/array/groupBy';

import isObjectEmpty from '../utils/object/isEmpty';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    // Group Transactions by type (income | outcome)
    const transactionsGroupByType = groupBy(transactions, 'type');
    let income = 0;
    let outcome = 0;
    let total = 0;

    // Check if object is empty
    if (isObjectEmpty(transactionsGroupByType)) {
      return { income, outcome, total };
    }

    // Calculate income | outcome
    Object.entries(transactionsGroupByType).forEach(([key, value]) => {
      switch (key) {
        case 'income':
          income = value.reduce((accumulator: number, currentValue) => {
            return accumulator + +currentValue.value; // Force currentValue.value to number
          }, 0);
          break;
        case 'outcome':
          outcome = value.reduce((accumulator, currentValue) => {
            return accumulator + +currentValue.value; // Force currentValue.value to number
          }, 0);
          break;
        default:
          break;
      }
    });

    // Calculate the total value
    total = income - outcome;

    return { income, outcome, total };
  }
}

export default TransactionsRepository;
