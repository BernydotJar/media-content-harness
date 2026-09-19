import {expect} from '@playwright/test'

export async function settleAuthenticatedEntry(page){
 await page.waitForURL(url=>/\/(?:dashboard|onboarding)$/.test(new URL(url).pathname),{timeout:10000})
 if(new URL(page.url()).pathname==='/onboarding'){
  await expect(page.getByRole('heading',{name:/Hola,/})).toBeVisible()
  await page.getByRole('button',{name:'Saltar por ahora'}).click()
 }
 await expect(page).toHaveURL(/\/dashboard$/)
}
