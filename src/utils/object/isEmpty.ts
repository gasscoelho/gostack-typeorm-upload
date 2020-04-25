export default function (obj: object): boolean {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}
