import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function Match(
  property: string /* Name of the property to compare with */,
  validationOptions?: ValidationOptions
) {
  // Returns the actual decorator function
  return function (object: Object, propertyName: string) {
    registerDecorator({
      // The name of the custom validator
      name: 'Match',
      // Class constructor
      target: object.constructor,
      // The property being decorated
      propertyName,
      // The name of the property to match against
      constraints: [property],
      ...(validationOptions && { options: validationOptions }),

      // Contains the validation logic
      validator: {
        validate(
          value: any /* The value of the propery being decorated/validated */,
          args: ValidationArguments
        ) {
          const [relatedPropertyName] = args.constraints;

          // The value of the property that we want to compare the decorated property with
          const relatedValue = (args.object as any)[relatedPropertyName];
          return relatedValue === value;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${propertyName} must match ${relatedPropertyName}`;
        },
      },
    });
  };
}
