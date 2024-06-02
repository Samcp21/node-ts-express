import { JwtAdapter, bcryptAdapter } from "../../config";
import { UserModel } from "../../data";
import { CustomError, RegisterUserDto } from "../../domain";
import { LoginUserDto } from "../../domain/dtos/auth/login-user-dto";
import { UserEntity } from "../../domain/entities/user.entity";

export class AuthService {
  constructor() {}

  public async registerUser(registerUserDto: RegisterUserDto) {
    const existUser = await UserModel.findOne({ email: registerUserDto.email });
    if (existUser) throw CustomError.badRequest("Email already exists");
    try {
      const user = new UserModel(registerUserDto);
      //encriptar password

      user.password = bcryptAdapter.hash(registerUserDto.password);

      await user.save();

      //JWT autenticacion del usuario
      const { password, ...userEntity } = await UserEntity.fromObject(user);

      return {
        user: userEntity,
        token: "token",
      };
    } catch (error) {
      throw CustomError.internalServer(`${error}`);
    }
  }

  public async LoginUser(loginUserDto: LoginUserDto) {
    const existUser = await UserModel.findOne({ email: loginUserDto.email });
    console.log(existUser);

    if (!existUser)
      return CustomError.badRequest("Email not found, please register");
    try {
      if (existUser) {
        if (bcryptAdapter.compare(loginUserDto.password, existUser.password)) {
          const { password, ...userEntity } = await UserEntity.fromObject(
            existUser
          );

          const token = await JwtAdapter.generateToken({
            id: userEntity.id,
            email: userEntity.email,
          });

          if (!token)
            throw CustomError.internalServer("Error while generating token");

          return {
            user: userEntity,
            token,
          };
        } else {
          throw CustomError.badRequest("Email or password is invalid");
        }
      }
    } catch (error) {
      throw CustomError.internalServer(`${error}`);
    }
  }
}
