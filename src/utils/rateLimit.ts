interface RateLimitOption {
  intervalSeconds: number;
  bucket: string;
}

const bucket: { [key: string]: number } = {};

function isRateLimited(key: string, seconds: number) {
  if (bucket[key]) {
    return true;
  } else {
    const allowedAt = new Date().getTime() + seconds;
    bucket[key] = allowedAt;
    setTimeout(() => {
      if (bucket[key]) delete bucket[key];
    }, seconds * 1000);
    return false;
  }
}

export default isRateLimited;
