type Headers = {
  [name: string]: string | undefined;
};

type KeyValue = [string, string | undefined];

export function normalize(headers: Headers): Headers {
  return Object.entries(headers)
    .map<KeyValue>(([key, value]) => [key.toLowerCase(), value])
    .reduce<Headers>(
      (headers, [key, value]) => ({ ...headers, [key]: value }),
      {},
    );
}
