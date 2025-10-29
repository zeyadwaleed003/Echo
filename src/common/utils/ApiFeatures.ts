import {
  FindManyOptions,
  FindOptionsOrder,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { QueryString } from '../types/api.types';

enum OrderBy {
  ASC = 'asc',
  DESC = 'desc',
}

class ApiFeatures<T extends ObjectLiteral> {
  private repository: Repository<T>;
  private queryString: QueryString;
  private queryOptions: FindManyOptions<T> = {};

  constructor(repository: Repository<T>, queryString: QueryString) {
    this.repository = repository;
    this.queryString = queryString;
  }

  private parseValue(value: any) {
    if (!isNaN(value as any) && value.trim() !== '') return Number(value);
    return value;
  }

  sort() {
    if (!this.queryString.sort) this.queryString.sort = '-createdAt';

    // sort=name,age,-country
    const sortBy = this.queryString.sort.split(',');
    const orderBy: Record<string, OrderBy> = {};

    /*
        I want to make a big object to look like this:

        {
            name: 'asc',
            age: 'asc',
            country: 'desc'
        }
    */

    sortBy.forEach((field) => {
      if (field.startsWith('-')) orderBy[field.substring(1)] = OrderBy.DESC;
      else orderBy[field] = OrderBy.ASC;
    });

    this.queryOptions.order = {
      ...this.queryOptions.order,
      ...orderBy,
    } as FindOptionsOrder<T>;
    return this;
  }

  // This function is not working yet
  filter() {
    const { sort, fields, limit, page, ...filter } = this.queryString;
    const where: Record<string, any> = {};

    for (const [field, condition] of Object.entries(filter)) {
      for (const [operator, rawValue] of Object.entries(condition)) {
        const value = this.parseValue(rawValue as any);

        switch (operator) {
          case 'gte':
            where[field] = MoreThanOrEqual(value);
            break;
          case 'lte':
            where[field] = LessThanOrEqual(value);
            break;
          case 'gt':
            where[field] = MoreThan(value);
            break;
          case 'lt':
            where[field] = LessThan(value);
            break;
          case 'ne':
            where[field] = Not(value);
            break;
          default:
            where[field] = this.parseValue(condition);
            break;
        }
      }
    }

    this.queryOptions.where = { ...this.queryOptions.where, ...where };
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',');
      this.queryOptions.select = fields as any;
    }

    return this;
  }

  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 100;
    const skip = (page - 1) * limit;

    this.queryOptions.skip = skip;
    this.queryOptions.take = limit;

    return this;
  }

  async exec() {
    return await this.repository.find(this.queryOptions);
  }
}

export default ApiFeatures;
