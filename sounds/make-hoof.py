# tiếng vó "cọc" kiểu gáo dừa: tiếng tách lúc chạm + các mode cộng hưởng của vỏ rỗng tắt nhanh
import math, random, wave, struct, sys
SR = 44100
def knock(scale, seed):
    rnd = random.Random(seed)
    n = int(SR * 0.16); out = [0.0] * n
    modes = [(480, .45, .030), (1150, 1.0, .022), (1900, .65, .014), (3050, .38, .008), (4600, .2, .005)]
    for f, a, d in modes:
        f *= scale * (1 + rnd.uniform(-.02, .02)); ph = rnd.random() * 6.28
        for i in range(n):
            t = i / SR
            out[i] += a * math.exp(-t / d) * math.sin(2 * math.pi * f * t + ph)
    prev = 0
    for i in range(int(SR * .002)):  # tách: nhiễu ngắn đã lọc cao
        w = rnd.uniform(-1, 1); out[i] += .9 * (w - prev) * (1 - i / (SR * .002)); prev = w
    for i in range(n):  # vọng sớm rất ngắn từ mặt đường
        j = i - int(SR * .011)
        if j >= 0: out[i] += .18 * out[j]
    for i in range(int(SR * .0006)): out[i] *= i / (SR * .0006)
    m = max(abs(v) for v in out)
    return [v / m * .9 for v in out]
for k, (sc, sd) in enumerate([(1.0, 1), (.9, 2), (1.1, 3)], 1):
    x = knock(sc, sd)
    w = wave.open(f'knock{k}.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(b''.join(struct.pack('<h', int(v * 32767)) for v in x)); w.close()
print('ok')
