import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Product, ProductType, ProductStatus } from '../entities/Product';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError } from '../utils/ApiError';

// Get all products
export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const productRepository = AppDataSource.getRepository(Product);
  
  const { type, status, category, page = 1, limit = 10 } = req.query;
  
  const queryBuilder = productRepository.createQueryBuilder('product')
    .leftJoinAndSelect('product.bids', 'bids')
    .orderBy('product.createdAt', 'DESC');

  // Apply filters
  if (type) {
    queryBuilder.andWhere('product.type = :type', { type });
  }
  
  if (status) {
    queryBuilder.andWhere('product.status = :status', { status });
  }
  
  if (category) {
    queryBuilder.andWhere('product.category = :category', { category });
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);
  queryBuilder.skip(skip).take(Number(limit));

  const [products, total] = await queryBuilder.getManyAndCount();

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  });
});

// Get single product by ID
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const productRepository = AppDataSource.getRepository(Product);
  
  const product = await productRepository.findOne({
    where: { id },
    relations: ['bids', 'bids.user']
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Increment view count
  product.viewCount += 1;
  await productRepository.save(product);

  res.json({
    success: true,
    data: {
      product
    }
  });
});

// Create new product
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    description,
    type,
    price,
    stockQuantity,
    startingPrice,
    auctionEndTime,
    minimumBidIncrement,
    category
  } = req.body;

  const productRepository = AppDataSource.getRepository(Product);

  const productData: any = {
    name,
    description,
    type,
    category
  };

  if (type === ProductType.FIXED_PRICE) {
    productData.price = price;
    productData.stockQuantity = stockQuantity;
  } else if (type === ProductType.AUCTION) {
    productData.startingPrice = startingPrice;
    productData.currentHighestBid = startingPrice;
    productData.auctionEndTime = auctionEndTime ? new Date(auctionEndTime) : null;
    productData.minimumBidIncrement = minimumBidIncrement;
  }

  const product = productRepository.create(productData);
  await productRepository.save(product);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: {
      product
    }
  });
});

// Update product
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const productRepository = AppDataSource.getRepository(Product);
  
  const product = await productRepository.findOne({ where: { id } });
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Update product fields
  Object.assign(product, req.body);
  
  await productRepository.save(product);

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: {
      product
    }
  });
});

// Delete product
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const productRepository = AppDataSource.getRepository(Product);
  
  const product = await productRepository.findOne({ where: { id } });
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  await productRepository.remove(product);

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
}); 