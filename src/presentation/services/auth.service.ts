import { JwtAdapter, bcryptAdapter, envs } from "../../config";
import { UserModel } from "../../data";
import { CustomError, RegisterUserDto } from "../../domain";
import { LoginUserDto } from "../../domain/dtos/auth/login-user-dto";
import { UserEntity } from "../../domain/entities/user.entity";
import { EmailService } from "./email.service";

export class AuthService {
  constructor(private readonly emailService: EmailService) {}

  public async registerUser(registerUserDto: RegisterUserDto) {
    const existUser = await UserModel.findOne({ email: registerUserDto.email });
    if (existUser) throw CustomError.badRequest("Email already exists");
    try {
      const user = new UserModel(registerUserDto);
      //encriptar password

      user.password = bcryptAdapter.hash(registerUserDto.password);

      await user.save();

      await this.sendEmailValidationLink(user.email);
      //JWT autenticacion del usuario
      const { password, ...userEntity } = await UserEntity.fromObject(user);

      const token = await JwtAdapter.generateToken({
        id: user.id,
      });

      if (!token)
        throw CustomError.internalServer("Error while generating token");

      return {
        user: userEntity,
        token,
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
  private sendEmailValidationLink = async (email: string) => {
    const token = await JwtAdapter.generateToken({ email });
    if (!token)
      throw CustomError.internalServer("Error while generating token");

    const link = `${envs.WEBSERICE_URL}/auth/validate-email/${token}`;
    console.log("link", link);
    const html = `
    <h1>Validate your email</h1>
    <p>Click on the following link to validate your email</p>
    <a href="${link}">Validate your email: ${email}</a>
  `;

    const options = {
      to: email,
      subject: "Email verification",
      htmlBody: html,
    };
    const isSent = await this.emailService.sendEmail(options);
    if (!isSent) throw CustomError.internalServer("Error while sending email");
    return true;
  };

  public validateEmail = async (token: string) => {
    const payload = await JwtAdapter.validateToken(token);

    if (!payload) {
      throw CustomError.badRequest("Invalid token");
    }
    const { email } = payload as { email: string };
    if (!email) throw CustomError.internalServer("Email is required");

    const user = await UserModel.findOne({
      email,
    });

    if (!user) throw CustomError.internalServer("Email not exists");

    user.emailValidate = true;
    await user.save();
    return true;
  };
}
