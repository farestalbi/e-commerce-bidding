import { Router } from "express";
import { placeBid } from "../../controllers/bidController";
import { authenticateToken } from "../../middleware/authentication";
import { validate } from "../../middleware/validation";
import { placeBidSchema } from "./bidSchema";

const router = Router();

// Place a bid on a product
router.post(
  "/product/:productId/bids",
  authenticateToken,
  validate(placeBidSchema),
  placeBid
);
export default router;
