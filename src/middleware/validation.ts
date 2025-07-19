import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../utils/ApiError";

export enum ValidationSource {
  BODY = "body",
  PARAMS = "params",
  QUERY = "query",
}

export const validate = (
  schema: any,
  validationSource: ValidationSource = ValidationSource.BODY
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[validationSource];
      const { error } = schema.validate(dataToValidate);

      if (error) {
        throw new BadRequestError(error.details[0].message);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
