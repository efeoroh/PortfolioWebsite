import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BASE = join(ROOT, 'brand_assets', 'projects');

async function proj(cat, name, desc, thumb, demo, isUrl = false) {
  const d = join(BASE, cat, name);
  await mkdir(join(d, 'description'), { recursive: true });
  await mkdir(join(d, 'thumbnail'), { recursive: true });
  await mkdir(join(d, 'demo'), { recursive: true });
  await writeFile(join(d, 'description', 'description.txt'), desc, 'utf8');
  if (thumb) await writeFile(join(d, 'thumbnail', 'ref.txt'), thumb, 'utf8');
  if (demo) await writeFile(join(d, 'demo', isUrl ? 'url.txt' : 'ref.txt'), demo, 'utf8');
  console.log('  ✓', name);
}

// LABOR ECONOMICS
await proj('labor_economics', '01_skilled_trades_dashboard',
  `Designed a geospatial Power BI dashboard using proxy data, integrating GIS tools and shapefiles to analyze and visualize skilled trades labour market trends. Delivered interactive, map-driven insights to support decision-making across regions and occupations.`,
  `brand_assets/Project_Screenshots/Labour_Economics/SkilledTradesDashboard/ST dash Apprentices.png`,
  `brand_assets/Project_Screenshots/Labour_Economics/SkilledTradesDashboard/ST dash.mp4`);

await proj('labor_economics', '02_migration_participation_rates',
  `Applied counterfactual economic modelling on 2M+ labour force records to quantify the impact of migration on Alberta's labour force participation. Produced a structured analytical report using R Markdown, translating complex results into clear, policy-relevant insights.`,
  `brand_assets/Project_Screenshots/Labour_Economics/ImpactofMigration.png`,
  `brand_assets/Project_Screenshots/Labour_Economics/Impact_of_Migration_on_Alberta_s_Participation_Rate.pdf`);

await proj('labor_economics', '03_hiring_demand_bulletins',
  `Owned and delivered Hiring Demand Bulletin, providing a comprehensive view of labour demand across regions and industries. Synthesized large-scale labour market data into concise, executive-ready insights for stakeholders.`,
  `brand_assets/Project_Screenshots/Automation/HD Bulletin.png`,
  `brand_assets/Project_Screenshots/Labour_Economics/Hiring Demand Bulletin_March 2025.pdf`);

await proj('labor_economics', '04_industry_profiles_report',
  `Automated data pulling and report generation for 18 industry profiles, processing 2M+ rows of data. Built a scalable data pipeline that reduced reporting time from approximately one month to a single execution — a 95%+ efficiency gain — while improving consistency and reliability.`,
  `brand_assets/Project_Screenshots/Labour_Economics/IndustryProfilesThumbnail.png`,
  null);

// ENERGY ANALYTICS
await proj('energy_analytics', '01_canadian_crude_price_outlook',
  `Designed a forward-looking economic analysis assessing how Canadian crude prices respond to net-zero transition scenarios and U.S. policy shifts. Combined API-sourced data, scenario modelling, and advanced visualization to translate complex market dynamics into decision-ready insights for stakeholders evaluating risk, pricing volatility, and long-term competitiveness.`,
  `brand_assets/Project_Screenshots/Energy_Analytics/crude_trade_vulnerability.png`,
  `brand_assets/Project_Screenshots/Energy_Analytics/CanadianCrudePrice_TradeVulnerability.html`);

await proj('energy_analytics', '02_canadian_energy_infrastructure',
  `Developed a data-driven analysis integrating large-scale energy datasets to quantify how pipeline constraints impact crude shipments and provincial royalty revenues. Built an end-to-end analytical workflow in R, combining API-based data pulls with structured transformations and state-of-the-art visualizations to surface bottlenecks and revenue sensitivities in Canada's energy system.`,
  `brand_assets/Project_Screenshots/Energy_Analytics/PipelineAnalysis.png`,
  `brand_assets/Project_Screenshots/Energy_Analytics/Shipment_Pipeline_Royalty_Analysis.html`);

await proj('energy_analytics', '03_canadian_electricity_emissions',
  `Constructed a comprehensive analytical framework to evaluate Canada's evolving electricity mix, linking generation sources to emissions outcomes under changing demand conditions. Leveraged large datasets and automated pipelines to produce high-impact visualizations and an R Markdown report, enabling clear interpretation of decarbonization trade-offs for energy policy and market analysis.`,
  `brand_assets/Project_Screenshots/Energy_Analytics/Electricity_Analysis.png`,
  `brand_assets/Project_Screenshots/Energy_Analytics/Canadian Electricity Market & Emissions Analysis (R).html`);

// AUTOMATION
await proj('automation', '01_industry_profiles_report',
  `Automated data pulling and report generation for 18 industry profiles, processing 2M+ rows of data. Built a scalable data pipeline that reduced reporting time from approximately one month to a single execution — a 95%+ efficiency gain — while improving consistency and reliability.`,
  `brand_assets/Project_Screenshots/Labour_Economics/IndustryProfilesThumbnail.png`,
  null);

await proj('automation', '02_lfs_indigenous_pipeline',
  `Automated the extraction and processing of 5M+ rows of Indigenous statistical data used in multiple recurring analytical reports, reducing reporting time by 90%+.`,
  null, null);

await proj('automation', '03_ghg_data_pull',
  `Automated the extraction and cleaning of 1M+ rows of greenhouse gas emissions data used in a GHG analytics dashboard. The workflow fully automated the data refresh pipeline for a dashboard requiring annual updates, eliminating manual data collection and ensuring reproducible updates each reporting cycle.`,
  `brand_assets/Project_Screenshots/Automation/GHGDataPull.png`,
  `brand_assets/Project_Screenshots/Automation/Webscraping research project (2) (1).mp4`);

// EMERGENCY ANALYTICS
await proj('emergency_analytics', '01_emergency_preparedness_dashboard',
  `Developed an automated geospatial analytics pipeline and Power BI dashboard to assess emergency preparedness across Canadian provinces using Statistics Canada data. Integrated R and Python to enable custom visualizations beyond native Power BI capabilities. Delivered a decision-ready tool highlighting regional disparities in preparedness for evidence-based public safety planning.`,
  `brand_assets/Project_Screenshots/Emergency_Analytics/Emergency_Preparedness.jpg`,
  `brand_assets/Project_Screenshots/Emergency_Analytics/Emergency_Preparedness.jpg`);

await proj('emergency_analytics', '02_road_safety_dashboard',
  `Developed a geospatial risk analytics dashboard in Tableau to assess road safety patterns and support emergency response planning. Processed large-scale accident datasets to identify high-risk conditions across vehicle types, weather, and road surfaces, with advanced interactive visualizations enabling rapid identification of critical risk drivers.`,
  `brand_assets/Project_Screenshots/Emergency_Analytics/Tableau| Road Accident Dashboard.png`,
  `https://public.tableau.com/views/RoadAccidentDashboard_16923967507060/Dashboard1?:language=en-US&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link`,
  true);

// OTHER
await proj('other', '01_spotify_analytics_dashboard',
  `Interactive Power BI dashboard analyzing Spotify streaming performance and listening trends.`,
  `brand_assets/Project_Screenshots/Music_Analytics/Power BI| Spotify Dashboard.png`,
  `brand_assets/Project_Screenshots/Music_Analytics/Power BI| Spotify Dashboard.png`);

console.log('\nProject structure ready.\n');
