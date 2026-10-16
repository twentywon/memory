export function shuffledCards(cards,random=Math.random){
 const result=[...cards];
 for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
 return result;
}
export function previousScreen(screen,topic){
 if(screen==='workspace')return 'choose';
 if(screen==='choose')return topic==='words'?'books':topic==='kings'?'leaders':topic==='hanja'?'grades':'home';
 return 'home';
}
