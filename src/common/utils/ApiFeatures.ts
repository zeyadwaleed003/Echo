import {
  Between,
  FindManyOptions,
  In,
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

    this.queryOptions.order = orderBy as any;
    return this;
  }

  filter() {
    const { sort, fields, limit, page, ...filterParams } = this.queryString;
    const whereOptions: Record<string, any> = {};

    Object.keys(filterParams).forEach((key) => {
      const value = filterParams[key];

      if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach((operation) => {
          switch (operation) {
            case 'gte':
              whereOptions[key] = MoreThanOrEqual(value[operation]);
              break;
            case 'gt':
              whereOptions[key] = MoreThan(value[operation]);
              break;
            case 'lte':
              whereOptions[key] = LessThanOrEqual(value[operation]);
              break;
            case 'lt':
              whereOptions[key] = LessThan(value[operation]);
              break;
            case 'ne':
              whereOptions[key] = Not(value[operation]);
              break;
            case 'in':
              whereOptions[key] = In((value[operation] as string).split(','));
              break;
            case 'between':
              const [min, max] = (value[operation] as string).split(',');
              whereOptions[key] = Between(min, max);
              break;
          }
        });
      } else {
        whereOptions[key] = value;
      }
    });

    this.queryOptions.where = whereOptions;
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',');
      this.queryOptions.select = fields;
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
