import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Product } from '../entities/Product';
import { Bid } from '../entities/Bid';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { dbHost, dbPort, dbUsername, dbPassword, dbName, environment } from './env';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbHost,
  port: dbPort,
  username: dbUsername,
  password: dbPassword,
  database: dbName,
  synchronize: environment === 'development',
  logging: false, // Disable SQL query logging
  entities: [User, Product, Bid, Order, OrderItem],
  migrations: [],
  subscribers: [],
});
