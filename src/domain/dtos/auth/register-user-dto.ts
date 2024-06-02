import { regularExps } from "../../../config";

export class RegisterUserDto {
  constructor(
    public name: string,
    public email: string,
    public password: string
  ) {}

  static create(object: { [key: string]: any }): [string?, RegisterUserDto?] {
    const { name, email, password } = object;
    if (!name) return ["name is required"];
    if (!regularExps.email.test(email)) return ["email is invalid"];
    if (!password) return ["password is required"];
    if (password.length < 6)
      return ["password must be at least 6 characters long"];
    return [undefined, new RegisterUserDto(name, email, password)];
  }
}
