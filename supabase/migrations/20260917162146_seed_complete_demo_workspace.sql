-- Dados demonstrativos completos da OctaReview.
-- A carga é idempotente e fica vinculada ao usuário administrador existente.

alter table public.profiles add column if not exists email text;
create index if not exists profiles_email_idx on public.profiles (lower(email)) where email is not null;

do $$
declare
  v_user uuid;
  v_org bigint;
  v_member bigint;
  v_primary bigint;
  v_lead_new bigint;
  v_lead_diag bigint;
  v_lead_proposal bigint;
  v_lead_negotiation bigint;
  v_lead_lost bigint;
  v_client_onboarding bigint;
  v_client_risk bigint;
  v_client_overdue bigint;
  v_team bigint;
  v_plan_pro bigint;
  v_plan_start bigint;
  v_addon bigint;
  v_subscription bigint;
  v_invoice_paid bigint;
  v_invoice_pending bigint;
  v_invoice_overdue bigint;
  v_unit bigint;
  v_contact bigint;
  v_plate_main bigint;
  v_plate_employee bigint;
  v_employee bigint;
  v_page bigint;
  v_page_menu bigint;
  v_page_campaign bigint;
  v_tag_vip bigint;
  v_tag_risk bigint;
  v_tag_onboarding bigint;
begin
  select id into v_user from auth.users where lower(email) = 'yurisilva1990@gmail.com' limit 1;
  if v_user is null then
    raise exception 'Usuário yurisilva1990@gmail.com não encontrado; carga demonstrativa cancelada.';
  end if;

  update public.profiles
  set full_name = 'Yuri Silva', email = 'yurisilva1990@gmail.com', updated_at = now()
  where id = v_user;

  select organization_id, id into v_org, v_member
  from public.organization_members
  where user_id = v_user and status = 'active'
  order by case when role = 'admin' then 0 else 1 end, id
  limit 1;

  if v_org is null then
    insert into public.organizations (name, slug, created_by)
    values ('OctaReview', 'octareview', v_user)
    returning id into v_org;
    insert into public.organization_members (organization_id, user_id, role, status, capacity)
    values (v_org, v_user, 'admin', 'active', 40)
    returning id into v_member;
  else
    update public.organization_members
    set role = 'admin', status = 'active', capacity = 40, updated_at = now()
    where id = v_member;
  end if;

  insert into public.organization_settings (organization_id, commercial, customer_portal, notifications, branding)
  values (
    v_org,
    '{"default_owner":"round_robin","follow_up_sla_hours":24,"demo_data":true}',
    '{"allow_multiple_pages":true,"default_modules":["reputation","plates","team","contacts","reports"]}',
    '{"email":true,"whatsapp":true,"billing":true}',
    '{"brand":"OctaReview","primary_color":"#087f78"}'
  )
  on conflict (organization_id) do update set
    commercial = excluded.commercial,
    customer_portal = excluded.customer_portal,
    notifications = excluded.notifications,
    branding = excluded.branding,
    updated_at = now();

  select id into v_primary from public.accounts where organization_id = v_org order by id limit 1;
  if v_primary is null then
    insert into public.accounts (organization_id, name, created_by) values (v_org, 'Café Aurora', v_user) returning id into v_primary;
  end if;

  update public.accounts set
    name = 'Café Aurora', legal_name = 'Café Aurora Comércio de Alimentos Ltda.', document = '12.345.678/0001-90',
    category = 'Cafeteria', source = 'indicação', city = 'São Paulo', state = 'SP',
    address = 'Rua Harmonia, 185 · Vila Madalena', phone = '(11) 98765-4321', email = 'contato@cafeaurora.demo',
    website = 'https://example.com/cafe-aurora', google_profile_url = 'https://maps.google.com/', potential = 'high',
    lifecycle_status = 'active', pipeline_stage = 'active', follow_up_status = 'post_sale', owner_member_id = v_member,
    client_since = current_date - 75, closed_at = now() - interval '75 days',
    metadata = '{"demo_key":"primary_client","rating":4.6,"reviews":238,"notes":"Cliente demonstrativo principal. Revisão mensal de resultados.","profile":"Boa reputação, volume consistente e oportunidade de aumentar respostas.","opportunity":"Aumentar a conversão de clientes satisfeitos em avaliações recentes.","approach":"Apresentar evolução dos últimos 30 dias e campanha para horário de pico.","purchaseUrl":"https://example.com/checkout/demo"}',
    updated_at = now()
  where id = v_primary;

  insert into public.account_users (organization_id, account_id, user_id, role, status, created_by)
  values (v_org, v_primary, v_user, 'owner', 'active', v_user)
  on conflict (account_id, user_id) do update set role = 'owner', status = 'active', updated_at = now();

  -- Função local da carga: cada registro é identificado por metadata.demo_key.
  insert into public.accounts (organization_id,name,category,source,city,state,address,phone,email,potential,lifecycle_status,pipeline_stage,follow_up_status,owner_member_id,metadata,created_by,created_at)
  select v_org,'Studio Movimento','Pilates','prospecção externa','São Paulo','SP','Rua das Flores, 42 · Pinheiros','(11) 95555-0101','contato@studiomovimento.demo','high','lead','new','none',v_member,'{"demo_key":"lead_new","rating":4.2,"reviews":61,"notes":"Primeiro contato ainda não realizado."}',v_user,now()-interval '2 hours'
  where not exists (select 1 from public.accounts where organization_id=v_org and metadata->>'demo_key'='lead_new');
  select id into v_lead_new from public.accounts where organization_id=v_org and metadata->>'demo_key'='lead_new';

  insert into public.accounts (organization_id,name,category,source,city,state,address,phone,email,potential,lifecycle_status,pipeline_stage,follow_up_status,owner_member_id,metadata,created_by,created_at)
  select v_org,'Clínica Sorriso Mais','Clínica odontológica','Google Maps','São Paulo','SP','Av. Paulista, 1450 · Bela Vista','(11) 94444-0202','recepcao@sorrisomais.demo','high','lead','diagnostic_presented','waiting',v_member,'{"demo_key":"lead_diagnostic","rating":4.1,"reviews":89,"notes":"Diagnóstico apresentado por videochamada."}',v_user,now()-interval '3 days'
  where not exists (select 1 from public.accounts where organization_id=v_org and metadata->>'demo_key'='lead_diagnostic');
  select id into v_lead_diag from public.accounts where organization_id=v_org and metadata->>'demo_key'='lead_diagnostic';

  insert into public.accounts (organization_id,name,category,source,city,state,address,phone,email,potential,lifecycle_status,pipeline_stage,follow_up_status,owner_member_id,metadata,created_by,created_at)
  select v_org,'PetCare Vila Nova','Pet shop','indicação','Campinas','SP','Rua do Bosque, 320 · Cambuí','(19) 93333-0303','gerencia@petcare.demo','medium','lead','proposal_sent','scheduled',v_member,'{"demo_key":"lead_proposal","rating":4.5,"reviews":127,"notes":"Proposta enviada; retorno combinado para hoje."}',v_user,now()-interval '6 days'
  where not exists (select 1 from public.accounts where organization_id=v_org and metadata->>'demo_key'='lead_proposal');
  select id into v_lead_proposal from public.accounts where organization_id=v_org and metadata->>'demo_key'='lead_proposal';

  insert into public.accounts (organization_id,name,category,source,city,state,address,phone,email,potential,lifecycle_status,pipeline_stage,follow_up_status,owner_member_id,metadata,created_by,created_at)
  select v_org,'Restaurante Raízes','Restaurante brasileiro','rota comercial','São Paulo','SP','Rua Augusta, 880 · Consolação','(11) 92222-0404','socios@raizes.demo','high','lead','negotiation','closing',v_member,'{"demo_key":"lead_negotiation","rating":4.0,"reviews":314,"notes":"Sócios avaliando plano Pro.","purchaseUrl":"https://example.com/checkout/pro"}',v_user,now()-interval '9 days'
  where not exists (select 1 from public.accounts where organization_id=v_org and metadata->>'demo_key'='lead_negotiation');
  select id into v_lead_negotiation from public.accounts where organization_id=v_org and metadata->>'demo_key'='lead_negotiation';

  insert into public.accounts (organization_id,name,category,source,city,state,address,phone,email,potential,lifecycle_status,pipeline_stage,follow_up_status,owner_member_id,lost_reason,metadata,created_by,created_at)
  select v_org,'Barbearia Central','Barbearia','prospecção externa','Osasco','SP','Av. dos Autonomistas, 1200','(11) 91111-0505','central@barbearia.demo','low','lost','lost','none',v_member,'Sem orçamento neste trimestre','{"demo_key":"lead_lost","rating":4.7,"reviews":42}',v_user,now()-interval '20 days'
  where not exists (select 1 from public.accounts where organization_id=v_org and metadata->>'demo_key'='lead_lost');
  select id into v_lead_lost from public.accounts where organization_id=v_org and metadata->>'demo_key'='lead_lost';

  insert into public.accounts (organization_id,name,category,source,city,state,address,phone,email,potential,lifecycle_status,pipeline_stage,follow_up_status,owner_member_id,client_since,closed_at,metadata,created_by)
  select v_org,'Ótica Horizonte','Ótica','parceria','Santo André','SP','Rua das Figueiras, 610','(11) 90000-0606','marketing@oticahorizonte.demo','medium','onboarding','onboarding','post_sale',v_member,current_date-10,now()-interval '10 days','{"demo_key":"client_onboarding","rating":4.4,"reviews":76}',v_user
  where not exists (select 1 from public.accounts where organization_id=v_org and metadata->>'demo_key'='client_onboarding');
  select id into v_client_onboarding from public.accounts where organization_id=v_org and metadata->>'demo_key'='client_onboarding';

  insert into public.accounts (organization_id,name,category,source,city,state,address,phone,email,potential,lifecycle_status,pipeline_stage,follow_up_status,owner_member_id,client_since,closed_at,metadata,created_by)
  select v_org,'Academia Pulse','Academia','indicação','São Paulo','SP','Av. Jabaquara, 910','(11) 98888-0707','diretoria@academiapulse.demo','high','at_risk','renewal','scheduled',v_member,current_date-210,now()-interval '210 days','{"demo_key":"client_risk","rating":3.9,"reviews":188,"notes":"Queda de uso nas últimas semanas."}',v_user
  where not exists (select 1 from public.accounts where organization_id=v_org and metadata->>'demo_key'='client_risk');
  select id into v_client_risk from public.accounts where organization_id=v_org and metadata->>'demo_key'='client_risk';

  insert into public.accounts (organization_id,name,category,source,city,state,address,phone,email,potential,lifecycle_status,pipeline_stage,follow_up_status,owner_member_id,client_since,closed_at,metadata,created_by)
  select v_org,'Salão Essenza','Salão de beleza','Google Maps','Guarulhos','SP','Rua Sete de Setembro, 73','(11) 97777-0808','financeiro@essenza.demo','medium','delinquent','active','post_sale',v_member,current_date-140,now()-interval '140 days','{"demo_key":"client_overdue","rating":4.3,"reviews":95,"notes":"Cobrança vencida; contato financeiro em andamento."}',v_user
  where not exists (select 1 from public.accounts where organization_id=v_org and metadata->>'demo_key'='client_overdue');
  select id into v_client_overdue from public.accounts where organization_id=v_org and metadata->>'demo_key'='client_overdue';

  -- Contatos principais dos oito negócios.
  insert into public.contacts (organization_id,account_id,full_name,job_title,email,phone,whatsapp,is_primary,notes)
  select v_org, x.account_id, x.full_name, x.job_title, x.email, x.phone, x.phone, true, 'Contato demonstrativo'
  from (values
    (v_primary,'Marina Alves','Sócia','marina@cafeaurora.demo','(11) 98765-4321'),
    (v_lead_new,'Rafael Mendes','Proprietário','rafael@studiomovimento.demo','(11) 95555-0101'),
    (v_lead_diag,'Dra. Camila Rocha','Diretora clínica','camila@sorrisomais.demo','(11) 94444-0202'),
    (v_lead_proposal,'Bruno Lima','Gerente','bruno@petcare.demo','(19) 93333-0303'),
    (v_lead_negotiation,'Ana e Carlos','Sócios','socios@raizes.demo','(11) 92222-0404'),
    (v_client_onboarding,'Luciana Prado','Marketing','luciana@oticahorizonte.demo','(11) 90000-0606'),
    (v_client_risk,'Eduardo Pires','Diretor','eduardo@academiapulse.demo','(11) 98888-0707'),
    (v_client_overdue,'Fernanda Luz','Proprietária','fernanda@essenza.demo','(11) 97777-0808')
  ) as x(account_id,full_name,job_title,email,phone)
  where x.account_id is not null and not exists (
    select 1 from public.contacts c where c.account_id=x.account_id and c.full_name=x.full_name
  );

  insert into public.teams (organization_id,name,purpose,active)
  values (v_org,'Comercial principal','commercial',true)
  on conflict (organization_id,name) do update set active=true, updated_at=now()
  returning id into v_team;
  insert into public.team_members (team_id,member_id,weight) values (v_team,v_member,10)
  on conflict (team_id,member_id) do update set weight=10;
  insert into public.distribution_rules (organization_id,name,priority,conditions,strategy,assignee_member_id,active)
  values (v_org,'Leads de alto potencial',1,'{"potential":"high"}','fixed_member',v_member,true)
  on conflict (organization_id,priority) do update set name=excluded.name,conditions=excluded.conditions,strategy=excluded.strategy,assignee_member_id=excluded.assignee_member_id,active=true,updated_at=now();
  insert into public.distribution_rules (organization_id,name,priority,conditions,strategy,assignee_team_id,active)
  values (v_org,'Demais oportunidades',2,'{}','team_round_robin',v_team,true)
  on conflict (organization_id,priority) do update set name=excluded.name,conditions=excluded.conditions,strategy=excluded.strategy,assignee_team_id=excluded.assignee_team_id,active=true,updated_at=now();

  insert into public.follow_ups (organization_id,account_id,responsible_member_id,reason,status,due_at,created_by)
  select v_org,x.account_id,v_member,x.reason,x.status,x.due_at,v_user from (values
    (v_lead_diag,'follow_proposal','overdue',date_trunc('day',now())-interval '1 day'+interval '15 hours'),
    (v_lead_proposal,'follow_proposal','scheduled',date_trunc('day',now())+interval '14 hours'),
    (v_lead_negotiation,'send_purchase_link','pending',date_trunc('day',now())+interval '16 hours 30 minutes'),
    (v_primary,'first_month_results','scheduled',date_trunc('day',now())+interval '2 days'+interval '10 hours'),
    (v_client_onboarding,'onboarding','pending',date_trunc('day',now())+interval '1 day'+interval '9 hours'),
    (v_client_risk,'renewal','scheduled',date_trunc('day',now())+interval '3 days'+interval '11 hours'),
    (v_client_overdue,'billing','overdue',date_trunc('day',now())-interval '2 days'+interval '10 hours')
  ) as x(account_id,reason,status,due_at)
  where not exists (select 1 from public.follow_ups f where f.account_id=x.account_id and f.reason=x.reason and f.status in ('pending','scheduled','overdue'));

  insert into public.notes (organization_id,account_id,author_id,body,visibility)
  select v_org,v_primary,v_user,'Cliente gostou da nova página. Revisar campanha de avaliações na próxima reunião.','customer'
  where not exists (select 1 from public.notes where account_id=v_primary and body like 'Cliente gostou%');
  insert into public.activities (organization_id,account_id,actor_id,activity_type,title,details,occurred_at)
  select v_org,x.account_id,v_user,x.activity_type,x.title,x.details,x.occurred_at from (values
    (v_primary,'customer_checkin','Reunião mensal realizada','{"channel":"video"}'::jsonb,now()-interval '1 day'),
    (v_lead_diag,'diagnostic_presented','Diagnóstico apresentado','{"score":72}'::jsonb,now()-interval '2 days'),
    (v_lead_proposal,'proposal_sent','Proposta comercial enviada','{"plan":"Pro"}'::jsonb,now()-interval '1 day'),
    (v_lead_negotiation,'whatsapp','Link de contratação preparado','{"channel":"whatsapp"}'::jsonb,now()-interval '3 hours')
  ) as x(account_id,activity_type,title,details,occurred_at)
  where not exists (select 1 from public.activities a where a.account_id=x.account_id and a.title=x.title);

  insert into public.tags (organization_id,name,color,scope) values (v_org,'VIP','#7C3AED','customer') on conflict (organization_id,name) do update set color=excluded.color returning id into v_tag_vip;
  insert into public.tags (organization_id,name,color,scope) values (v_org,'Em risco','#DC2626','customer') on conflict (organization_id,name) do update set color=excluded.color returning id into v_tag_risk;
  insert into public.tags (organization_id,name,color,scope) values (v_org,'Implantação','#0891B2','customer') on conflict (organization_id,name) do update set color=excluded.color returning id into v_tag_onboarding;
  insert into public.account_tags (organization_id,account_id,tag_id,assigned_by) values
    (v_org,v_primary,v_tag_vip,v_user),(v_org,v_client_risk,v_tag_risk,v_user),(v_org,v_client_onboarding,v_tag_onboarding,v_user)
  on conflict (account_id,tag_id) do nothing;

  insert into public.diagnostics (organization_id,account_id,requested_by,status,mode,provider,input,report,started_at,completed_at)
  select v_org,v_lead_diag,v_user,'completed','demo','apify','{"businessName":"Clínica Sorriso Mais","location":"São Paulo"}',
    '{"business":{"title":"Clínica Sorriso Mais","address":"Av. Paulista, 1450"},"input":{"category":"Clínica odontológica"},"summary":{"rating":4.1,"reviewsCount":89,"profile":"Boa nota, poucas avaliações recentes e respostas irregulares.","narrative":"Há espaço para aumentar a frequência de avaliações e fortalecer a percepção de atendimento."},"opportunities":[{"title":"Aumentar avaliações recentes","solution":"Ativar placas e abordagem pós-atendimento."}],"competitors":[]}',
    now()-interval '2 days 1 hour',now()-interval '2 days'
  where not exists (select 1 from public.diagnostics where account_id=v_lead_diag and status='completed');

  insert into public.account_units (organization_id,account_id,name,address,city,state)
  values (v_org,v_primary,'Unidade Vila Madalena','Rua Harmonia, 185','São Paulo','SP')
  on conflict (account_id,name) do update set address=excluded.address,city=excluded.city,state=excluded.state,updated_at=now()
  returning id into v_unit;

  insert into public.products (organization_id,name,code,product_type,billing_type,interval,price,description,features,active)
  values (v_org,'OctaReview Pro','PRO','base_plan','recurring','monthly',297.00,'Gestão de reputação, placas e múltiplas páginas.','{"page_limit":3,"plates":5,"reports":true}',true)
  on conflict (organization_id,code) do update set name=excluded.name,price=excluded.price,features=excluded.features,active=true,updated_at=now()
  returning id into v_plan_pro;
  insert into public.products (organization_id,name,code,product_type,billing_type,interval,price,description,features,active)
  values (v_org,'OctaReview Essencial','START','base_plan','recurring','monthly',147.00,'Plano de entrada com uma página.','{"page_limit":1,"plates":1}',true)
  on conflict (organization_id,code) do update set name=excluded.name,price=excluded.price,features=excluded.features,active=true,updated_at=now()
  returning id into v_plan_start;
  insert into public.products (organization_id,name,code,product_type,billing_type,interval,price,description,features,active)
  values (v_org,'MobileSite','MOBILE-SITE','recurring_addon','recurring','monthly',97.00,'Site mobile completo adicional.','{"mobile_site":true}',true)
  on conflict (organization_id,code) do update set name=excluded.name,price=excluded.price,features=excluded.features,active=true,updated_at=now()
  returning id into v_addon;

  insert into public.subscriptions (organization_id,account_id,product_id,status,quantity,unit_price,billing_interval,due_day,starts_on,current_period_start,current_period_end,metadata)
  select v_org,v_primary,v_plan_pro,'active',1,297.00,'monthly',10,current_date-75,date_trunc('month',current_date)::date,(date_trunc('month',current_date)+interval '1 month - 1 day')::date,'{"demo":true}'
  where not exists (select 1 from public.subscriptions where account_id=v_primary and product_id=v_plan_pro and status in ('active','trial','past_due'))
  returning id into v_subscription;
  if v_subscription is null then select id into v_subscription from public.subscriptions where account_id=v_primary and product_id=v_plan_pro order by id desc limit 1; end if;
  insert into public.subscriptions (organization_id,account_id,product_id,status,quantity,unit_price,billing_interval,due_day,starts_on,current_period_start,current_period_end,metadata)
  select v_org,v_client_overdue,v_plan_start,'past_due',1,147.00,'monthly',5,current_date-140,date_trunc('month',current_date)::date,(date_trunc('month',current_date)+interval '1 month - 1 day')::date,'{"demo":true}'
  where not exists (select 1 from public.subscriptions where account_id=v_client_overdue and product_id=v_plan_start and status in ('active','trial','past_due'));

  insert into public.invoices (organization_id,account_id,subscription_id,status,description,amount,due_date,paid_at,payment_method,external_id,payment_url)
  select v_org,v_primary,v_subscription,'paid','Mensalidade OctaReview Pro · mês anterior',297.00,current_date-20,now()-interval '20 days','pix','demo-paid-001','https://example.com/pagamento/pago'
  where not exists (select 1 from public.invoices where external_id='demo-paid-001');
  select id into v_invoice_paid from public.invoices where external_id='demo-paid-001';
  insert into public.invoices (organization_id,account_id,subscription_id,status,description,amount,due_date,external_id,payment_url)
  select v_org,v_primary,v_subscription,'pending','Mensalidade OctaReview Pro · mês atual',297.00,current_date+7,'demo-pending-001','https://example.com/pagamento/pendente'
  where not exists (select 1 from public.invoices where external_id='demo-pending-001') returning id into v_invoice_pending;
  insert into public.invoices (organization_id,account_id,status,description,amount,due_date,external_id,payment_url)
  select v_org,v_client_overdue,'overdue','Mensalidade OctaReview Essencial',147.00,current_date-8,'demo-overdue-001','https://example.com/pagamento/vencido'
  where not exists (select 1 from public.invoices where external_id='demo-overdue-001') returning id into v_invoice_overdue;
  insert into public.payments (organization_id,account_id,invoice_id,status,amount,payment_method,received_at,external_id,raw_payload)
  select v_org,v_primary,v_invoice_paid,'received',297.00,'pix',now()-interval '20 days','demo-payment-001','{"provider":"demo"}'
  where v_invoice_paid is not null and not exists (select 1 from public.payments where external_id='demo-payment-001');

  insert into public.customer_portal_settings (account_id,organization_id,enabled_modules,branding,preferences,portal_enabled)
  values (v_primary,v_org,array['reputation','plates','team','contacts','reports','services'], '{"primary_color":"#087f78","logo_mode":"wordmark"}', '{"weekly_report":true,"locale":"pt-BR"}', true)
  on conflict (account_id) do update set enabled_modules=excluded.enabled_modules,branding=excluded.branding,preferences=excluded.preferences,portal_enabled=true,updated_at=now();

  insert into public.plates (public_id,organization_id,plate_type,lifecycle_status,activation_code_hash,account_id,unit_id,destination_config,activated_at,display_name,location_label,destination_mode)
  values ('A900001',v_org,'main','in_use','demo-not-for-activation',v_primary,v_unit,'{"mode":"page"}',now()-interval '60 days','Balcão principal','Recepção','page')
  on conflict (public_id) do update set account_id=excluded.account_id,unit_id=excluded.unit_id,lifecycle_status='in_use',display_name=excluded.display_name,location_label=excluded.location_label,updated_at=now()
  returning id into v_plate_main;
  insert into public.plates (public_id,organization_id,plate_type,lifecycle_status,activation_code_hash,account_id,unit_id,destination_config,activated_at,display_name,location_label,destination_mode)
  values ('P900002',v_org,'employee','in_use','demo-not-for-activation',v_primary,v_unit,'{"mode":"page"}',now()-interval '45 days','Placa da Marina','Salão','page')
  on conflict (public_id) do update set account_id=excluded.account_id,unit_id=excluded.unit_id,lifecycle_status='in_use',display_name=excluded.display_name,location_label=excluded.location_label,updated_at=now()
  returning id into v_plate_employee;
  select id into v_contact from public.contacts where account_id=v_primary and is_primary order by id limit 1;
  insert into public.plate_assignments (organization_id,plate_id,account_id,unit_id,contact_id,assigned_by,reason)
  select v_org,v_plate_main,v_primary,v_unit,v_contact,v_user,'Placa demonstrativa do estabelecimento'
  where not exists (select 1 from public.plate_assignments where plate_id=v_plate_main and unassigned_at is null);

  insert into public.employees (organization_id,account_id,full_name,job_title,status)
  select v_org,v_primary,'Marina Alves','Gerente de atendimento','active'
  where not exists (select 1 from public.employees where account_id=v_primary and full_name='Marina Alves')
  returning id into v_employee;
  if v_employee is null then select id into v_employee from public.employees where account_id=v_primary and full_name='Marina Alves'; end if;
  insert into public.employees (organization_id,account_id,full_name,job_title,status)
  select v_org,v_primary,'João Pedro','Barista','active'
  where not exists (select 1 from public.employees where account_id=v_primary and full_name='João Pedro');
  insert into public.employees (organization_id,account_id,full_name,job_title,status)
  select v_org,v_primary,'Bianca Souza','Atendimento','active'
  where not exists (select 1 from public.employees where account_id=v_primary and full_name='Bianca Souza');
  insert into public.employee_plate_assignments (organization_id,account_id,employee_id,plate_id,assigned_by,reason)
  select v_org,v_primary,v_employee,v_plate_employee,v_user,'Placa individual demonstrativa'
  where not exists (select 1 from public.employee_plate_assignments where plate_id=v_plate_employee and unassigned_at is null);

  select id into v_page from public.smart_pages where account_id=v_primary order by is_primary desc,id limit 1;
  if v_page is null then
    insert into public.smart_pages (organization_id,account_id,slug,status,is_primary,name) values (v_org,v_primary,'cafe-aurora-demo','published',true,'Café Aurora') returning id into v_page;
  end if;
  update public.smart_pages set
    slug='cafe-aurora-demo', status='published', page_type='biosite', is_primary=true, name='Café Aurora',
    short_description='Café especial, encontros e boas histórias na Vila Madalena.',
    presentation_text='Conheça nosso cardápio, fale com a equipe e compartilhe sua experiência.', primary_color='#087F78',
    cover_type='image', background_mode='preset', background_value='ivory-paper', button_color='#0F766E',
    highlight_color='#16A34A', form_button_color='#EA580C', button_shape='round', button_variant='filled', button_border_width=2,
    footer_text='Café Aurora · feito com carinho em São Paulo', capture_enabled=true,
    capture_config='{"title":"Entre para o Clube Aurora","description":"Receba novidades e benefícios.","button_text":"Quero participar","success_message":"Cadastro realizado!","fields":[{"key":"full_name","label":"Nome","required":true},{"key":"whatsapp","label":"WhatsApp","required":true},{"key":"birth_date","label":"Data de nascimento","required":false}],"consent_required":true,"consent_text":"Aceito receber comunicações do Café Aurora."}',
    draft_version=3,published_version=3,published_at=now(),updated_at=now()
  where id=v_page;

  insert into public.smart_pages (organization_id,account_id,slug,status,page_type,is_primary,name,short_description,background_mode,background_value,button_color,highlight_color,form_button_color,button_shape,button_variant,button_border_width,published_version,published_at)
  select v_org,v_primary,'cardapio-cafe-aurora','published','menu',false,'Cardápio Café Aurora','Veja bebidas, cafés e acompanhamentos.','preset','green-organic','#14532D','#CA8A04','#14532D','soft','outline',2,1,now()
  where not exists (select 1 from public.smart_pages where slug='cardapio-cafe-aurora') returning id into v_page_menu;
  if v_page_menu is null then select id into v_page_menu from public.smart_pages where slug='cardapio-cafe-aurora'; end if;
  insert into public.smart_pages (organization_id,account_id,slug,status,page_type,is_primary,name,short_description,background_mode,background_value,button_color,highlight_color,form_button_color,button_shape,button_variant,button_border_width,published_version,published_at)
  select v_org,v_primary,'clube-aurora','published','campaign',false,'Clube Aurora','Benefícios para quem ama café especial.','preset','burgundy-gradient','#7F1D1D','#EA580C','#EA580C','round','filled',1,1,now()
  where not exists (select 1 from public.smart_pages where slug='clube-aurora') returning id into v_page_campaign;

  insert into public.page_links (organization_id,account_id,smart_page_id,link_type,title,subtitle,url,sort_order,active,highlighted)
  select v_org,v_primary,v_page,x.link_type,x.title,x.subtitle,x.url,x.sort_order,true,x.highlighted from (values
    ('whatsapp','Fale com a gente','Pedidos e reservas','https://wa.me/5511987654321',1,true),
    ('google_review','Avalie o Café Aurora','Conte como foi sua experiência','https://maps.google.com/',2,false),
    ('menu','Ver cardápio','Cafés, doces e salgados','https://example.com/cardapio',3,false),
    ('map','Como chegar','Vila Madalena · São Paulo','https://maps.google.com/',4,false),
    ('instagram','Instagram',null,'https://instagram.com/',10,false),
    ('facebook','Facebook',null,'https://facebook.com/',11,false),
    ('youtube','YouTube',null,'https://youtube.com/',12,false)
  ) as x(link_type,title,subtitle,url,sort_order,highlighted)
  where not exists (select 1 from public.page_links l where l.smart_page_id=v_page and l.link_type=x.link_type);

  insert into public.captured_contacts (organization_id,account_id,smart_page_id,plate_id,source,full_name,whatsapp,email,birth_date,city,consent_accepted,consent_text,campaign,captured_at)
  select v_org,v_primary,v_page,case when x.source='nfc' then v_plate_main else null end,x.source,x.full_name,x.whatsapp,x.email,x.birth_date,x.city,true,'Aceito receber comunicações do Café Aurora.',x.campaign,x.captured_at from (values
    ('nfc','Juliana Martins','(11) 99661-1001','juliana@example.com','1992-05-12'::date,'São Paulo','balcao-setembro',now()-interval '2 hours'),
    ('qr','Pedro Henrique','(11) 99661-1002','pedro@example.com',null,'São Paulo','mesa-qr',now()-interval '1 day'),
    ('page','Aline Costa','(11) 99661-1003','aline@example.com','1988-11-03'::date,'Osasco','instagram-bio',now()-interval '3 days'),
    ('campaign','Lucas Freire','(11) 99661-1004','lucas@example.com',null,'São Paulo','clube-aurora',now()-interval '7 days'),
    ('direct','Beatriz Nunes','(11) 99661-1005','bia@example.com',null,'Santo André',null,now()-interval '12 days')
  ) as x(source,full_name,whatsapp,email,birth_date,city,campaign,captured_at)
  where not exists (select 1 from public.captured_contacts c where c.account_id=v_primary and c.email=x.email);

  insert into public.interaction_events (organization_id,account_id,smart_page_id,plate_id,event_type,source,session_id,campaign,device,occurred_at)
  select v_org,v_primary,v_page,
    case when n%3=0 then v_plate_main else null end,
    case when n%11=0 then 'lead_submit' when n%7=0 then 'whatsapp_click' when n%5=0 then 'google_review_click' when n%3=0 then 'plate_open' else 'page_view' end,
    case when n%3=0 then 'nfc' when n%2=0 then 'qr' else 'page' end,
    gen_random_uuid(),case when n%4=0 then 'clube-aurora' else null end,
    jsonb_build_object('device',case when n%2=0 then 'mobile' else 'tablet' end),
    now()-(n||' hours')::interval
  from generate_series(1,72) as n
  where not exists (select 1 from public.interaction_events e where e.account_id=v_primary and e.metadata->>'demo_batch'='initial')
  ;
  update public.interaction_events set metadata = metadata || '{"demo_batch":"initial"}'::jsonb
  where account_id=v_primary and metadata='{}'::jsonb and occurred_at >= now()-interval '73 hours';

  insert into public.integrations (organization_id,provider,status,config,last_sync_at)
  values (v_org,'apify','connected','{"actor":"compass/crawler-google-places","demo":true}',now()-interval '1 hour')
  on conflict (organization_id,provider) do update set status='connected',config=excluded.config,last_sync_at=excluded.last_sync_at,updated_at=now();
  insert into public.integrations (organization_id,provider,status,config)
  values (v_org,'asaas','not_configured','{"ready_for_api":true}')
  on conflict (organization_id,provider) do update set config=excluded.config,updated_at=now();
  insert into public.integrations (organization_id,provider,status,config,last_sync_at)
  values (v_org,'google_business','connected','{"demo":true}',now()-interval '6 hours')
  on conflict (organization_id,provider) do update set status='connected',config=excluded.config,last_sync_at=excluded.last_sync_at,updated_at=now();

  insert into public.notifications (organization_id,user_id,notification_type,title,body,action_url)
  select v_org,v_user,x.notification_type,x.title,x.body,x.action_url from (values
    ('follow_up','3 retornos para hoje','PetCare, Restaurante Raízes e Clínica Sorriso Mais precisam de atenção.','/app/'),
    ('lead','Novo contato capturado','Juliana Martins entrou pelo NFC do balcão.','/cliente/'),
    ('billing','Cobrança vencida','Salão Essenza possui uma mensalidade vencida.','/adm/')
  ) as x(notification_type,title,body,action_url)
  where not exists (select 1 from public.notifications n where n.user_id=v_user and n.title=x.title);
end $$;
