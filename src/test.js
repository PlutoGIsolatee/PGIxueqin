import jiebaFactory from '@ig3/node-jieba-js';
import fs from 'node:fs/promises';




(async function(){
  try{
    const segmenter = await new Intl.Segmenter('zh', { granularity: "word" });
    const book = '......-10'/*await fs.readFile('./sample.txt');*/
    const segmented =  segmenter.segment(book.slice(0, 10000));
    for (const { segment: s } of segmented) {
      console.log(s);
    }
  } catch(err) {
    console.log(err);
  }
})();

