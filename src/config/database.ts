import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Product } from '../entities/Product';
import { Bid } from '../entities/Bid';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { dbHost, dbPort, dbUsername, dbPassword, dbName, environment } from './env';

console.log('Database Configuration:');
console.log('Host:', dbHost);
console.log('Port:', dbPort);
console.log('Database:', dbName);
console.log('Username:', dbUsername);
console.log('Environment:', environment);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbHost,
  port: dbPort,
  username: dbUsername,
  password: dbPassword,
  database: dbName,
  synchronize: environment === 'development',
  logging: environment === 'development',
  entities: [User, Product, Bid, Order, OrderItem],
  migrations: [],
  subscribers: [],
});
