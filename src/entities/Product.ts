import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Bid } from './Bid';
import { OrderItem } from './OrderItem';

export enum ProductType {
  FIXED_PRICE = 'fixed_price',
  AUCTION = 'auction'
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SOLD = 'sold',
  EXPIRED = 'expired',
  CONCLUDED = 'concluded'
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ProductType
  })
  type: ProductType;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE
  })
  status: ProductStatus;

  // Fixed-price product fields
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ nullable: true })
  stockQuantity: number;

  // Auction product fields
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  startingPrice: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  currentHighestBid: number;

  @Column({ nullable: true })
  auctionEndTime: Date;



  // Common fields
  @Column({ nullable: true })
  category: string;

  @Column({ default: 0 })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Bid, bid => bid.product)
  bids: Bid[];

  @OneToMany(() => OrderItem, orderItem => orderItem.product)
  orderItems: OrderItem[];
} 