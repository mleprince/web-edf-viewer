export default class AppConstants {
    public static readonly gainList: Array<{ value: number, label: string }> =
        [0.001, 0.01, 0.1, 0.2, 0.5, 1, 2, 4, 5, 10, 20, 50, 100,200,500, 1000,10000].map(v => {
            return { value: v, label: v + "uV/cm" };
        });

    public static readonly resolutionList: Array<number> = [5, 10, 20, 30, 60].map(x => x * 1000);

    public static readonly notchList = [50, 60];
    public static readonly lowpassList = [35, 50, 70, 100, 200, 400];
    public static readonly highpassList = [0.1, 0.3, 0.5, 1, 2, 10];

    public static readonly defaultFilters: Array<[string, number | null]> = [
        ["Notch", null],
        ["Highpass", null],
        ["Lowpass", null]
    ];

    public static defaultGain = 100; // 100 uV/cm
}
