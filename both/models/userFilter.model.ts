export class UserFilter {
  name: string;
  lookupName: string;
  conditions: [Condition]
}

interface Condition {
  column: string;
  type: string;
  method: string;
  value: any;
}