import { NextFunction, Request, Response } from "express";
import { JwtAdapter } from "../../config";
import { UserModel } from "../../data";
import { UserEntity } from "../../domain";

export class AuthMiddleware {
  static async validateToken(req: Request, res: Response, next: NextFunction) {
    const { authorization } = req.headers;
    if (!authorization) return res.status(401).json({ error: "Unauthorized" });
    if (!authorization.startsWith("Bearer "))
      return res.status(401).json({ error: "Unauthorized" });

    const token = authorization.split(" ").at(1) || "";

    try {
      const decoded = await JwtAdapter.validateToken<{ id: string }>(token);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const user = await UserModel.findById(decoded.id);
      if (!user) return res.status(401).json({ error: "Invalid token - user" });

      req.body.user = UserEntity.fromObject(user);

      next();
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
