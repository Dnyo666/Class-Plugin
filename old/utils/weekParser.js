export function parseWeeks(weekStr) {
  // 解析周数格式
  const result = {
    weeks: [],
    type: 'all'
  }
  
  // 处理单双周
  if(weekStr.includes('单周')) {
    result.type = 'odd'
    result.weeks = Array.from({length:16}, (v,i) => i+1).filter(w => w%2===1)
  } else if(weekStr.includes('双周')) {
    result.type = 'even' 
    result.weeks = Array.from({length:16}, (v,i) => i+1).filter(w => w%2===0)
  } else {
    // 处理范围周 如:1-16周
    const match = weekStr.match(/(\d+)-(\d+)/)
    if(match) {
      const [, start, end] = match
      result.weeks = Array.from(
        {length: end-start+1}, 
        (v,i) => parseInt(start)+i
      )
    }
  }
  
  return result
} 