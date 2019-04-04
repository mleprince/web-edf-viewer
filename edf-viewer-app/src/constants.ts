export default class AppConstants {
    public static readonly gainList: Array<{ value: number, label: string }> =
        [0.001, 0.01, 0.1, 0.2, 0.5, 1, 2, 4, 5, 10, 20, 50, 100, 1000].map(v => {
            return { value: v, label: v + "uV/cm" };
        });

    public static readonly resolutionList: Array<number> = [5, 10, 20, 30, 60].map(x => x * 1000);
}
