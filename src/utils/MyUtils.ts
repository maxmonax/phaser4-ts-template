import { MyMath } from './MyMath';

export class MyUtils {
  /** File name without the directory part. Accepts both `/` and `\` separators. */
  public static getFileName(aFilePath: string): string {
    return (aFilePath.split('\\').pop() ?? aFilePath).split('/').pop() ?? aFilePath;
  }

  /**
   * Lower-cased file extension without the dot, or `''` if there is none.
   * @param ignore - lower-cased extensions to skip: `getFileExt('a.png.meta', ['meta'])` is `'png'`
   */
  public static getFileExt(aFileName: string, ignore: string[] = []): string {
    const parts = MyUtils.getFileName(aFileName).split('.');
    // parts[0] is the name itself, so a file without dots has no extension
    for (let i = parts.length - 1; i > 0; i--) {
      const ext = parts[i].toLowerCase();
      if (!ignore.includes(ext)) return ext;
    }
    return '';
  }

  /** Formats a duration as `HH:MM:SS`. */
  public static secondsToHMS(seconds: number): string {
    const total = Math.max(0, Math.round(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remainingSeconds = total % 60;

    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = remainingSeconds.toString().padStart(2, '0');

    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }

  static getRandomValueFromArray<T>(aMas: T[]): T {
    const id = MyMath.randomIntInRange(0, aMas.length - 1);
    return aMas[id];
  }
}
