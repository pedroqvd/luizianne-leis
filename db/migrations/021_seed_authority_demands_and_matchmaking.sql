-- ============================================================
-- 021_seed_authority_demands_and_matchmaking.sql
-- Carteira Estruturada de Demandas Municipais para os 184 Prefeitos do Ceará
-- e Otimização do Mecanismo de Traqueamento de Editais Federais
-- ============================================================

-- 1. Constraint Única para edital_authority_tracking (edital_id, authority_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'edital_authority_tracking_edital_auth_uniq'
  ) THEN
    -- Remove duplicatas pré-existentes se houver
    DELETE FROM edital_authority_tracking a
    USING edital_authority_tracking b
    WHERE a.id > b.id
      AND a.edital_id = b.edital_id
      AND a.authority_id = b.authority_id;

    ALTER TABLE edital_authority_tracking
      ADD CONSTRAINT edital_authority_tracking_edital_auth_uniq
      UNIQUE (edital_id, authority_id);
  END IF;
END $$;

-- 2. Inserção das demandas mapeadas para os 184 municípios
INSERT INTO authority_demands (
  authority_id,
  municipality_ibge,
  municipality_name,
  title,
  description,
  category,
  keywords,
  target_ministry,
  funding_type,
  estimated_value,
  status,
  priority
)

          SELECT ma.id, '2300101', 'Abaiara', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Abaiara', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Abaiara / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300101' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300101', 'Abaiara', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Abaiara', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Abaiara / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300101' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300101', 'Abaiara', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Abaiara', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Abaiara / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300101' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300150', 'Acarape', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Acarape', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Acarape / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300150' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300150', 'Acarape', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Acarape', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Acarape / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300150' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300150', 'Acarape', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Acarape', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Acarape / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300150' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300200', 'Acaraú', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Acaraú', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Acaraú / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300200' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300200', 'Acaraú', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Acaraú', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Acaraú / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300200' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300200', 'Acaraú', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Acaraú', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Acaraú / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300200' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300309', 'Acopiara', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Acopiara', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Acopiara / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300309' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300309', 'Acopiara', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Acopiara', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Acopiara / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300309' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300309', 'Acopiara', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Acopiara', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Acopiara / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300309' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300408', 'Aiuaba', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Aiuaba', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Aiuaba / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300408' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300408', 'Aiuaba', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Aiuaba', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Aiuaba / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300408' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300408', 'Aiuaba', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Aiuaba', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Aiuaba / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300408' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300507', 'Alcântaras', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Alcântaras', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Alcântaras / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300507' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300507', 'Alcântaras', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Alcântaras', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Alcântaras / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300507' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300507', 'Alcântaras', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Alcântaras', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Alcântaras / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300507' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300606', 'Altaneira', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Altaneira', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Altaneira / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300606' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300606', 'Altaneira', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Altaneira', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Altaneira / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300606' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300606', 'Altaneira', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Altaneira', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Altaneira / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300606' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300705', 'Alto Santo', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Alto Santo', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Alto Santo / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300705' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300705', 'Alto Santo', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Alto Santo', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Alto Santo / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300705' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300705', 'Alto Santo', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Alto Santo', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Alto Santo / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300705' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300754', 'Amontada', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Amontada', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Amontada / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300754' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300754', 'Amontada', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Amontada', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Amontada / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300754' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300754', 'Amontada', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Amontada', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Amontada / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300754' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300804', 'Antonina do Norte', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Antonina do Norte', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Antonina do Norte / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300804' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300804', 'Antonina do Norte', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Antonina do Norte', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Antonina do Norte / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300804' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300804', 'Antonina do Norte', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Antonina do Norte', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Antonina do Norte / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300804' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300903', 'Apuiarés', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Apuiarés', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Apuiarés / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300903' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300903', 'Apuiarés', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Apuiarés', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Apuiarés / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300903' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2300903', 'Apuiarés', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Apuiarés', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Apuiarés / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2300903' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301000', 'Aquiraz', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Aquiraz', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Aquiraz / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301000' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301000', 'Aquiraz', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Aquiraz', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Aquiraz / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301000' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301000', 'Aquiraz', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Aquiraz', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Aquiraz / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301000' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301109', 'Aracati', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Aracati', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Aracati / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301109' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301109', 'Aracati', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Aracati', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Aracati / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301109' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301109', 'Aracati', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Aracati', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Aracati / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301109' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301208', 'Aracoiaba', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Aracoiaba', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Aracoiaba / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301208' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301208', 'Aracoiaba', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Aracoiaba', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Aracoiaba / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301208' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301208', 'Aracoiaba', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Aracoiaba', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Aracoiaba / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301208' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301257', 'Ararendá', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Ararendá', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Ararendá / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301257' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301257', 'Ararendá', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Ararendá', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Ararendá / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301257' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301257', 'Ararendá', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Ararendá', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Ararendá / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301257' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301307', 'Araripe', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Araripe', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Araripe / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301307' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301307', 'Araripe', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Araripe', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Araripe / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301307' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301307', 'Araripe', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Araripe', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Araripe / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301307' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301406', 'Aratuba', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Aratuba', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Aratuba / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301406' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301406', 'Aratuba', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Aratuba', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Aratuba / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301406' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301406', 'Aratuba', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Aratuba', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Aratuba / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301406' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301505', 'Arneiroz', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Arneiroz', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Arneiroz / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301505' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301505', 'Arneiroz', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Arneiroz', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Arneiroz / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301505' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301505', 'Arneiroz', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Arneiroz', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Arneiroz / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301505' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301604', 'Assaré', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Assaré', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Assaré / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301604' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301604', 'Assaré', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Assaré', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Assaré / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301604' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301604', 'Assaré', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Assaré', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Assaré / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301604' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301703', 'Aurora', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Aurora', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Aurora / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301703' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301703', 'Aurora', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Aurora', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Aurora / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301703' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301703', 'Aurora', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Aurora', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Aurora / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301703' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301802', 'Baixio', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Baixio', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Baixio / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301802' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301802', 'Baixio', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Baixio', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Baixio / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301802' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301802', 'Baixio', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Baixio', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Baixio / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301802' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301851', 'Banabuiú', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Banabuiú', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Banabuiú / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301851' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301851', 'Banabuiú', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Banabuiú', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Banabuiú / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301851' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301851', 'Banabuiú', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Banabuiú', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Banabuiú / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301851' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301901', 'Barbalha', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Barbalha', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Barbalha / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301901' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301901', 'Barbalha', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Barbalha', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Barbalha / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301901' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301901', 'Barbalha', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Barbalha', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Barbalha / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301901' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301950', 'Barreira', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Barreira', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Barreira / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301950' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301950', 'Barreira', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Barreira', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Barreira / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301950' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2301950', 'Barreira', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Barreira', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Barreira / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2301950' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302008', 'Barro', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Barro', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Barro / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302008' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302008', 'Barro', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Barro', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Barro / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302008' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302008', 'Barro', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Barro', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Barro / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302008' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302057', 'Barroquinha', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Barroquinha', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Barroquinha / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302057' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302057', 'Barroquinha', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Barroquinha', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Barroquinha / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302057' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302057', 'Barroquinha', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Barroquinha', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Barroquinha / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302057' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302107', 'Baturité', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Baturité', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Baturité / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302107' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302107', 'Baturité', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Baturité', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Baturité / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302107' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302107', 'Baturité', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Baturité', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Baturité / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302107' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302206', 'Beberibe', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Beberibe', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Beberibe / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302206' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302206', 'Beberibe', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Beberibe', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Beberibe / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302206' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302206', 'Beberibe', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Beberibe', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Beberibe / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302206' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302305', 'Bela Cruz', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Bela Cruz', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Bela Cruz / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302305' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302305', 'Bela Cruz', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Bela Cruz', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Bela Cruz / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302305' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302305', 'Bela Cruz', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Bela Cruz', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Bela Cruz / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302305' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302404', 'Boa Viagem', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Boa Viagem', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Boa Viagem / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302404' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302404', 'Boa Viagem', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Boa Viagem', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Boa Viagem / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302404' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302404', 'Boa Viagem', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Boa Viagem', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Boa Viagem / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302404' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302503', 'Brejo Santo', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Brejo Santo', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Brejo Santo / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302503' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302503', 'Brejo Santo', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Brejo Santo', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Brejo Santo / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302503' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302503', 'Brejo Santo', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Brejo Santo', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Brejo Santo / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302503' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302602', 'Camocim', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Camocim', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Camocim / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302602' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302602', 'Camocim', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Camocim', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Camocim / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302602' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302602', 'Camocim', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Camocim', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Camocim / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302602' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302701', 'Campos Sales', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Campos Sales', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Campos Sales / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302701' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302701', 'Campos Sales', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Campos Sales', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Campos Sales / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302701' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302701', 'Campos Sales', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Campos Sales', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Campos Sales / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302701' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302800', 'Canindé', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Canindé', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Canindé / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302800' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302800', 'Canindé', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Canindé', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Canindé / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302800' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302800', 'Canindé', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Canindé', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Canindé / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302800' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302909', 'Capistrano', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Capistrano', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Capistrano / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302909' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302909', 'Capistrano', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Capistrano', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Capistrano / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302909' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2302909', 'Capistrano', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Capistrano', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Capistrano / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2302909' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303006', 'Caridade', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Caridade', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Caridade / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303006' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303006', 'Caridade', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Caridade', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Caridade / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303006' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303006', 'Caridade', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Caridade', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Caridade / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303006' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303105', 'Cariré', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Cariré', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Cariré / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303105' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303105', 'Cariré', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Cariré', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Cariré / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303105' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303105', 'Cariré', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Cariré', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Cariré / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303105' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303204', 'Caririaçu', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Caririaçu', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Caririaçu / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303204' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303204', 'Caririaçu', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Caririaçu', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Caririaçu / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303204' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303204', 'Caririaçu', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Caririaçu', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Caririaçu / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303204' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303303', 'Cariús', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Cariús', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Cariús / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303303' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303303', 'Cariús', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Cariús', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Cariús / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303303' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303303', 'Cariús', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Cariús', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Cariús / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303303' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303402', 'Carnaubal', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Carnaubal', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Carnaubal / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303402' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303402', 'Carnaubal', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Carnaubal', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Carnaubal / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303402' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303402', 'Carnaubal', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Carnaubal', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Carnaubal / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303402' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303501', 'Cascavel', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Cascavel', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Cascavel / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303501' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303501', 'Cascavel', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Cascavel', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Cascavel / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303501' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303501', 'Cascavel', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Cascavel', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Cascavel / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303501' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303600', 'Catarina', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Catarina', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Catarina / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303600' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303600', 'Catarina', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Catarina', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Catarina / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303600' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303600', 'Catarina', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Catarina', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Catarina / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303600' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303659', 'Catunda', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Catunda', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Catunda / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303659' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303659', 'Catunda', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Catunda', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Catunda / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303659' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303659', 'Catunda', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Catunda', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Catunda / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303659' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303709', 'Caucaia', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Caucaia', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Caucaia / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303709' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303709', 'Caucaia', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Caucaia', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Caucaia / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303709' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303709', 'Caucaia', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Caucaia', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Caucaia / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303709' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303808', 'Cedro', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Cedro', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Cedro / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303808' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303808', 'Cedro', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Cedro', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Cedro / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303808' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303808', 'Cedro', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Cedro', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Cedro / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303808' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303907', 'Chaval', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Chaval', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Chaval / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303907' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303907', 'Chaval', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Chaval', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Chaval / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303907' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303907', 'Chaval', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Chaval', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Chaval / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303907' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303931', 'Choró', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Choró', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Choró / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303931' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303931', 'Choró', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Choró', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Choró / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303931' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303931', 'Choró', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Choró', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Choró / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303931' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303956', 'Chorozinho', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Chorozinho', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Chorozinho / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303956' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303956', 'Chorozinho', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Chorozinho', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Chorozinho / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303956' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2303956', 'Chorozinho', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Chorozinho', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Chorozinho / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2303956' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304004', 'Coreaú', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Coreaú', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Coreaú / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304004' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304004', 'Coreaú', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Coreaú', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Coreaú / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304004' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304004', 'Coreaú', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Coreaú', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Coreaú / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304004' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304103', 'Crateús', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Crateús', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Crateús / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304103' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304103', 'Crateús', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Crateús', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Crateús / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304103' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304103', 'Crateús', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Crateús', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Crateús / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304103' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304202', 'Crato', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Crato', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Crato / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304202' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304202', 'Crato', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Crato', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Crato / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304202' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304202', 'Crato', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Crato', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Crato / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304202' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304236', 'Croatá', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Croatá', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Croatá / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304236' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304236', 'Croatá', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Croatá', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Croatá / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304236' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304236', 'Croatá', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Croatá', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Croatá / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304236' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304251', 'Cruz', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Cruz', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Cruz / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304251' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304251', 'Cruz', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Cruz', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Cruz / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304251' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304251', 'Cruz', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Cruz', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Cruz / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304251' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304269', 'Deputado Irapuan Pinheiro', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Deputado Irapuan Pinheiro', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Deputado Irapuan Pinheiro / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304269' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304269', 'Deputado Irapuan Pinheiro', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Deputado Irapuan Pinheiro', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Deputado Irapuan Pinheiro / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304269' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304269', 'Deputado Irapuan Pinheiro', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Deputado Irapuan Pinheiro', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Deputado Irapuan Pinheiro / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304269' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304277', 'Ererê', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Ererê', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Ererê / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304277' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304277', 'Ererê', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Ererê', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Ererê / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304277' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304277', 'Ererê', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Ererê', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Ererê / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304277' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304285', 'Eusébio', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Eusébio', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Eusébio / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304285' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304285', 'Eusébio', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Eusébio', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Eusébio / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304285' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304285', 'Eusébio', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Eusébio', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Eusébio / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304285' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304301', 'Farias Brito', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Farias Brito', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Farias Brito / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304301' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304301', 'Farias Brito', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Farias Brito', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Farias Brito / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304301' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304301', 'Farias Brito', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Farias Brito', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Farias Brito / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304301' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304350', 'Forquilha', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Forquilha', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Forquilha / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304350' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304350', 'Forquilha', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Forquilha', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Forquilha / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304350' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304350', 'Forquilha', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Forquilha', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Forquilha / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304350' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304400', 'Fortaleza', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Fortaleza', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Fortaleza / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304400' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304400', 'Fortaleza', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Fortaleza', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Fortaleza / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304400' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304400', 'Fortaleza', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Fortaleza', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Fortaleza / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304400' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304459', 'Fortim', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Fortim', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Fortim / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304459' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304459', 'Fortim', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Fortim', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Fortim / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304459' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304459', 'Fortim', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Fortim', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Fortim / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304459' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304509', 'Frecheirinha', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Frecheirinha', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Frecheirinha / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304509' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304509', 'Frecheirinha', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Frecheirinha', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Frecheirinha / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304509' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304509', 'Frecheirinha', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Frecheirinha', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Frecheirinha / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304509' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304608', 'General Sampaio', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - General Sampaio', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de General Sampaio / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304608' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304608', 'General Sampaio', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - General Sampaio', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de General Sampaio / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304608' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304608', 'General Sampaio', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - General Sampaio', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de General Sampaio / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304608' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304657', 'Graça', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Graça', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Graça / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304657' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304657', 'Graça', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Graça', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Graça / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304657' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304657', 'Graça', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Graça', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Graça / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304657' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304707', 'Granja', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Granja', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Granja / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304707' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304707', 'Granja', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Granja', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Granja / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304707' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304707', 'Granja', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Granja', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Granja / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304707' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304806', 'Granjeiro', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Granjeiro', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Granjeiro / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304806' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304806', 'Granjeiro', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Granjeiro', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Granjeiro / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304806' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304806', 'Granjeiro', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Granjeiro', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Granjeiro / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304806' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304905', 'Groaíras', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Groaíras', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Groaíras / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304905' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304905', 'Groaíras', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Groaíras', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Groaíras / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304905' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304905', 'Groaíras', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Groaíras', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Groaíras / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304905' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304954', 'Guaiúba', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Guaiúba', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Guaiúba / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304954' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304954', 'Guaiúba', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Guaiúba', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Guaiúba / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304954' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2304954', 'Guaiúba', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Guaiúba', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Guaiúba / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2304954' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305001', 'Guaraciaba do Norte', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Guaraciaba do Norte', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Guaraciaba do Norte / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305001' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305001', 'Guaraciaba do Norte', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Guaraciaba do Norte', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Guaraciaba do Norte / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305001' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305001', 'Guaraciaba do Norte', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Guaraciaba do Norte', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Guaraciaba do Norte / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305001' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305100', 'Guaramiranga', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Guaramiranga', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Guaramiranga / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305100' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305100', 'Guaramiranga', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Guaramiranga', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Guaramiranga / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305100' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305100', 'Guaramiranga', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Guaramiranga', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Guaramiranga / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305100' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305209', 'Hidrolândia', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Hidrolândia', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Hidrolândia / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305209' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305209', 'Hidrolândia', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Hidrolândia', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Hidrolândia / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305209' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305209', 'Hidrolândia', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Hidrolândia', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Hidrolândia / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305209' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305233', 'Horizonte', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Horizonte', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Horizonte / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305233' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305233', 'Horizonte', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Horizonte', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Horizonte / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305233' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305233', 'Horizonte', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Horizonte', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Horizonte / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305233' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305266', 'Ibaretama', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Ibaretama', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Ibaretama / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305266' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305266', 'Ibaretama', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Ibaretama', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Ibaretama / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305266' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305266', 'Ibaretama', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Ibaretama', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Ibaretama / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305266' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305308', 'Ibiapina', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Ibiapina', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Ibiapina / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305308' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305308', 'Ibiapina', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Ibiapina', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Ibiapina / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305308' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305308', 'Ibiapina', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Ibiapina', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Ibiapina / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305308' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305332', 'Ibicuitinga', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Ibicuitinga', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Ibicuitinga / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305332' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305332', 'Ibicuitinga', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Ibicuitinga', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Ibicuitinga / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305332' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305332', 'Ibicuitinga', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Ibicuitinga', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Ibicuitinga / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305332' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305357', 'Icapuí', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Icapuí', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Icapuí / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305357' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305357', 'Icapuí', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Icapuí', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Icapuí / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305357' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305357', 'Icapuí', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Icapuí', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Icapuí / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305357' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305407', 'Icó', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Icó', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Icó / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305407' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305407', 'Icó', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Icó', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Icó / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305407' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305407', 'Icó', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Icó', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Icó / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305407' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305506', 'Iguatu', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Iguatu', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Iguatu / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305506' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305506', 'Iguatu', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Iguatu', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Iguatu / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305506' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305506', 'Iguatu', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Iguatu', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Iguatu / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305506' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305605', 'Independência', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Independência', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Independência / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305605' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305605', 'Independência', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Independência', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Independência / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305605' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305605', 'Independência', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Independência', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Independência / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305605' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305654', 'Ipaporanga', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Ipaporanga', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Ipaporanga / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305654' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305654', 'Ipaporanga', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Ipaporanga', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Ipaporanga / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305654' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305654', 'Ipaporanga', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Ipaporanga', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Ipaporanga / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305654' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305704', 'Ipaumirim', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Ipaumirim', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Ipaumirim / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305704' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305704', 'Ipaumirim', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Ipaumirim', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Ipaumirim / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305704' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305704', 'Ipaumirim', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Ipaumirim', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Ipaumirim / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305704' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305803', 'Ipu', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Ipu', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Ipu / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305803' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305803', 'Ipu', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Ipu', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Ipu / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305803' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305803', 'Ipu', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Ipu', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Ipu / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305803' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305902', 'Ipueiras', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Ipueiras', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Ipueiras / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305902' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305902', 'Ipueiras', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Ipueiras', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Ipueiras / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305902' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2305902', 'Ipueiras', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Ipueiras', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Ipueiras / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2305902' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306009', 'Iracema', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Iracema', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Iracema / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306009' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306009', 'Iracema', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Iracema', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Iracema / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306009' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306009', 'Iracema', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Iracema', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Iracema / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306009' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306108', 'Irauçuba', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Irauçuba', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Irauçuba / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306108' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306108', 'Irauçuba', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Irauçuba', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Irauçuba / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306108' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306108', 'Irauçuba', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Irauçuba', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Irauçuba / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306108' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306207', 'Itaiçaba', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Itaiçaba', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Itaiçaba / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306207' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306207', 'Itaiçaba', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Itaiçaba', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Itaiçaba / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306207' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306207', 'Itaiçaba', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Itaiçaba', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Itaiçaba / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306207' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306256', 'Itaitinga', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Itaitinga', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Itaitinga / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306256' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306256', 'Itaitinga', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Itaitinga', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Itaitinga / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306256' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306256', 'Itaitinga', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Itaitinga', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Itaitinga / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306256' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306306', 'Itapajé', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Itapajé', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Itapajé / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306306' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306306', 'Itapajé', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Itapajé', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Itapajé / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306306' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306306', 'Itapajé', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Itapajé', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Itapajé / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306306' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306405', 'Itapipoca', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Itapipoca', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Itapipoca / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306405' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306405', 'Itapipoca', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Itapipoca', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Itapipoca / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306405' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306405', 'Itapipoca', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Itapipoca', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Itapipoca / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306405' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306504', 'Itapiúna', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Itapiúna', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Itapiúna / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306504' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306504', 'Itapiúna', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Itapiúna', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Itapiúna / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306504' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306504', 'Itapiúna', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Itapiúna', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Itapiúna / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306504' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306553', 'Itarema', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Itarema', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Itarema / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306553' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306553', 'Itarema', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Itarema', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Itarema / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306553' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306553', 'Itarema', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Itarema', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Itarema / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306553' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306603', 'Itatira', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Itatira', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Itatira / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306603' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306603', 'Itatira', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Itatira', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Itatira / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306603' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306603', 'Itatira', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Itatira', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Itatira / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306603' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306702', 'Jaguaretama', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Jaguaretama', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Jaguaretama / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306702' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306702', 'Jaguaretama', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Jaguaretama', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Jaguaretama / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306702' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306702', 'Jaguaretama', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Jaguaretama', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Jaguaretama / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306702' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306801', 'Jaguaribara', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Jaguaribara', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Jaguaribara / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306801' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306801', 'Jaguaribara', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Jaguaribara', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Jaguaribara / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306801' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306801', 'Jaguaribara', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Jaguaribara', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Jaguaribara / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306801' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306900', 'Jaguaribe', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Jaguaribe', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Jaguaribe / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306900' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306900', 'Jaguaribe', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Jaguaribe', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Jaguaribe / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306900' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2306900', 'Jaguaribe', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Jaguaribe', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Jaguaribe / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2306900' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307007', 'Jaguaruana', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Jaguaruana', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Jaguaruana / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307007' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307007', 'Jaguaruana', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Jaguaruana', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Jaguaruana / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307007' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307007', 'Jaguaruana', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Jaguaruana', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Jaguaruana / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307007' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307106', 'Jardim', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Jardim', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Jardim / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307106' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307106', 'Jardim', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Jardim', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Jardim / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307106' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307106', 'Jardim', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Jardim', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Jardim / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307106' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307205', 'Jati', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Jati', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Jati / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307205' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307205', 'Jati', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Jati', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Jati / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307205' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307205', 'Jati', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Jati', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Jati / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307205' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307254', 'Jijoca de Jericoacoara', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Jijoca de Jericoacoara', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Jijoca de Jericoacoara / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307254' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307254', 'Jijoca de Jericoacoara', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Jijoca de Jericoacoara', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Jijoca de Jericoacoara / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307254' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307254', 'Jijoca de Jericoacoara', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Jijoca de Jericoacoara', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Jijoca de Jericoacoara / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307254' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307304', 'Juazeiro do Norte', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Juazeiro do Norte', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Juazeiro do Norte / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307304' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307304', 'Juazeiro do Norte', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Juazeiro do Norte', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Juazeiro do Norte / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307304' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307304', 'Juazeiro do Norte', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Juazeiro do Norte', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Juazeiro do Norte / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307304' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307403', 'Jucás', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Jucás', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Jucás / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307403' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307403', 'Jucás', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Jucás', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Jucás / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307403' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307403', 'Jucás', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Jucás', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Jucás / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307403' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307502', 'Lavras da Mangabeira', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Lavras da Mangabeira', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Lavras da Mangabeira / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307502' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307502', 'Lavras da Mangabeira', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Lavras da Mangabeira', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Lavras da Mangabeira / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307502' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307502', 'Lavras da Mangabeira', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Lavras da Mangabeira', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Lavras da Mangabeira / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307502' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307601', 'Limoeiro do Norte', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Limoeiro do Norte', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Limoeiro do Norte / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307601' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307601', 'Limoeiro do Norte', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Limoeiro do Norte', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Limoeiro do Norte / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307601' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307601', 'Limoeiro do Norte', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Limoeiro do Norte', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Limoeiro do Norte / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307601' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307635', 'Madalena', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Madalena', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Madalena / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307635' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307635', 'Madalena', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Madalena', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Madalena / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307635' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307635', 'Madalena', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Madalena', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Madalena / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307635' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307650', 'Maracanaú', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Maracanaú', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Maracanaú / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307650' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307650', 'Maracanaú', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Maracanaú', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Maracanaú / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307650' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307650', 'Maracanaú', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Maracanaú', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Maracanaú / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307650' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307700', 'Maranguape', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Maranguape', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Maranguape / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307700' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307700', 'Maranguape', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Maranguape', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Maranguape / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307700' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307700', 'Maranguape', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Maranguape', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Maranguape / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307700' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307809', 'Marco', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Marco', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Marco / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307809' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307809', 'Marco', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Marco', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Marco / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307809' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307809', 'Marco', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Marco', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Marco / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307809' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307908', 'Martinópole', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Martinópole', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Martinópole / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307908' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307908', 'Martinópole', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Martinópole', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Martinópole / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307908' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2307908', 'Martinópole', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Martinópole', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Martinópole / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2307908' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308005', 'Massapê', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Massapê', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Massapê / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308005' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308005', 'Massapê', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Massapê', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Massapê / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308005' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308005', 'Massapê', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Massapê', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Massapê / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308005' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308104', 'Mauriti', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Mauriti', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Mauriti / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308104' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308104', 'Mauriti', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Mauriti', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Mauriti / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308104' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308104', 'Mauriti', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Mauriti', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Mauriti / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308104' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308203', 'Meruoca', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Meruoca', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Meruoca / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308203' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308203', 'Meruoca', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Meruoca', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Meruoca / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308203' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308203', 'Meruoca', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Meruoca', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Meruoca / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308203' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308302', 'Milagres', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Milagres', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Milagres / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308302' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308302', 'Milagres', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Milagres', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Milagres / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308302' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308302', 'Milagres', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Milagres', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Milagres / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308302' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308351', 'Milhã', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Milhã', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Milhã / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308351' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308351', 'Milhã', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Milhã', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Milhã / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308351' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308351', 'Milhã', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Milhã', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Milhã / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308351' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308377', 'Miraíma', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Miraíma', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Miraíma / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308377' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308377', 'Miraíma', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Miraíma', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Miraíma / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308377' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308377', 'Miraíma', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Miraíma', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Miraíma / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308377' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308401', 'Missão Velha', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Missão Velha', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Missão Velha / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308401' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308401', 'Missão Velha', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Missão Velha', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Missão Velha / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308401' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308401', 'Missão Velha', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Missão Velha', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Missão Velha / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308401' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308500', 'Mombaça', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Mombaça', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Mombaça / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308500' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308500', 'Mombaça', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Mombaça', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Mombaça / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308500' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308500', 'Mombaça', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Mombaça', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Mombaça / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308500' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308609', 'Monsenhor Tabosa', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Monsenhor Tabosa', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Monsenhor Tabosa / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308609' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308609', 'Monsenhor Tabosa', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Monsenhor Tabosa', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Monsenhor Tabosa / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308609' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308609', 'Monsenhor Tabosa', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Monsenhor Tabosa', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Monsenhor Tabosa / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308609' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308708', 'Morada Nova', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Morada Nova', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Morada Nova / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308708' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308708', 'Morada Nova', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Morada Nova', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Morada Nova / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308708' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308708', 'Morada Nova', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Morada Nova', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Morada Nova / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308708' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308807', 'Moraújo', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Moraújo', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Moraújo / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308807' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308807', 'Moraújo', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Moraújo', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Moraújo / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308807' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308807', 'Moraújo', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Moraújo', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Moraújo / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308807' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308906', 'Morrinhos', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Morrinhos', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Morrinhos / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308906' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308906', 'Morrinhos', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Morrinhos', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Morrinhos / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308906' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2308906', 'Morrinhos', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Morrinhos', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Morrinhos / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2308906' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309003', 'Mucambo', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Mucambo', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Mucambo / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309003' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309003', 'Mucambo', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Mucambo', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Mucambo / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309003' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309003', 'Mucambo', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Mucambo', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Mucambo / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309003' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309102', 'Mulungu', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Mulungu', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Mulungu / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309102' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309102', 'Mulungu', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Mulungu', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Mulungu / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309102' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309102', 'Mulungu', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Mulungu', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Mulungu / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309102' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309201', 'Nova Olinda', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Nova Olinda', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Nova Olinda / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309201' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309201', 'Nova Olinda', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Nova Olinda', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Nova Olinda / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309201' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309201', 'Nova Olinda', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Nova Olinda', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Nova Olinda / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309201' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309300', 'Nova Russas', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Nova Russas', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Nova Russas / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309300' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309300', 'Nova Russas', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Nova Russas', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Nova Russas / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309300' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309300', 'Nova Russas', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Nova Russas', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Nova Russas / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309300' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309409', 'Novo Oriente', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Novo Oriente', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Novo Oriente / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309409' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309409', 'Novo Oriente', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Novo Oriente', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Novo Oriente / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309409' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309409', 'Novo Oriente', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Novo Oriente', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Novo Oriente / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309409' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309458', 'Ocara', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Ocara', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Ocara / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309458' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309458', 'Ocara', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Ocara', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Ocara / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309458' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309458', 'Ocara', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Ocara', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Ocara / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309458' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309508', 'Orós', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Orós', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Orós / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309508' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309508', 'Orós', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Orós', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Orós / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309508' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309508', 'Orós', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Orós', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Orós / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309508' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309607', 'Pacajus', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Pacajus', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Pacajus / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309607' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309607', 'Pacajus', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Pacajus', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Pacajus / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309607' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309607', 'Pacajus', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Pacajus', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Pacajus / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309607' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309706', 'Pacatuba', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Pacatuba', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Pacatuba / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309706' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309706', 'Pacatuba', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Pacatuba', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Pacatuba / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309706' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309706', 'Pacatuba', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Pacatuba', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Pacatuba / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309706' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309805', 'Pacoti', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Pacoti', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Pacoti / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309805' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309805', 'Pacoti', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Pacoti', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Pacoti / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309805' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309805', 'Pacoti', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Pacoti', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Pacoti / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309805' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309904', 'Pacujá', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Pacujá', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Pacujá / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309904' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309904', 'Pacujá', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Pacujá', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Pacujá / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309904' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2309904', 'Pacujá', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Pacujá', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Pacujá / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2309904' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310001', 'Palhano', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Palhano', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Palhano / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310001' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310001', 'Palhano', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Palhano', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Palhano / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310001' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310001', 'Palhano', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Palhano', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Palhano / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310001' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310100', 'Palmácia', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Palmácia', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Palmácia / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310100' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310100', 'Palmácia', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Palmácia', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Palmácia / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310100' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310100', 'Palmácia', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Palmácia', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Palmácia / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310100' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310209', 'Paracuru', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Paracuru', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Paracuru / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310209' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310209', 'Paracuru', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Paracuru', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Paracuru / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310209' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310209', 'Paracuru', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Paracuru', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Paracuru / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310209' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310258', 'Paraipaba', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Paraipaba', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Paraipaba / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310258' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310258', 'Paraipaba', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Paraipaba', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Paraipaba / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310258' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310258', 'Paraipaba', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Paraipaba', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Paraipaba / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310258' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310308', 'Parambu', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Parambu', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Parambu / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310308' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310308', 'Parambu', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Parambu', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Parambu / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310308' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310308', 'Parambu', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Parambu', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Parambu / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310308' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310407', 'Paramoti', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Paramoti', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Paramoti / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310407' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310407', 'Paramoti', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Paramoti', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Paramoti / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310407' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310407', 'Paramoti', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Paramoti', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Paramoti / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310407' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310506', 'Pedra Branca', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Pedra Branca', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Pedra Branca / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310506' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310506', 'Pedra Branca', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Pedra Branca', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Pedra Branca / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310506' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310506', 'Pedra Branca', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Pedra Branca', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Pedra Branca / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310506' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310605', 'Penaforte', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Penaforte', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Penaforte / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310605' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310605', 'Penaforte', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Penaforte', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Penaforte / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310605' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310605', 'Penaforte', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Penaforte', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Penaforte / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310605' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310704', 'Pentecoste', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Pentecoste', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Pentecoste / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310704' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310704', 'Pentecoste', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Pentecoste', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Pentecoste / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310704' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310704', 'Pentecoste', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Pentecoste', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Pentecoste / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310704' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310803', 'Pereiro', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Pereiro', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Pereiro / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310803' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310803', 'Pereiro', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Pereiro', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Pereiro / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310803' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310803', 'Pereiro', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Pereiro', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Pereiro / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310803' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310852', 'Pindoretama', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Pindoretama', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Pindoretama / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310852' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310852', 'Pindoretama', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Pindoretama', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Pindoretama / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310852' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310852', 'Pindoretama', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Pindoretama', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Pindoretama / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310852' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310902', 'Piquet Carneiro', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Piquet Carneiro', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Piquet Carneiro / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310902' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310902', 'Piquet Carneiro', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Piquet Carneiro', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Piquet Carneiro / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310902' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310902', 'Piquet Carneiro', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Piquet Carneiro', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Piquet Carneiro / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310902' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310951', 'Pires Ferreira', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Pires Ferreira', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Pires Ferreira / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310951' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310951', 'Pires Ferreira', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Pires Ferreira', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Pires Ferreira / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310951' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2310951', 'Pires Ferreira', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Pires Ferreira', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Pires Ferreira / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2310951' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311009', 'Poranga', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Poranga', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Poranga / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311009' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311009', 'Poranga', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Poranga', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Poranga / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311009' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311009', 'Poranga', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Poranga', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Poranga / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311009' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311108', 'Porteiras', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Porteiras', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Porteiras / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311108' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311108', 'Porteiras', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Porteiras', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Porteiras / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311108' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311108', 'Porteiras', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Porteiras', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Porteiras / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311108' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311207', 'Potengi', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Potengi', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Potengi / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311207' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311207', 'Potengi', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Potengi', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Potengi / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311207' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311207', 'Potengi', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Potengi', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Potengi / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311207' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311231', 'Potiretama', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Potiretama', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Potiretama / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311231' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311231', 'Potiretama', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Potiretama', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Potiretama / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311231' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311231', 'Potiretama', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Potiretama', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Potiretama / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311231' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311264', 'Quiterianópolis', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Quiterianópolis', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Quiterianópolis / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311264' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311264', 'Quiterianópolis', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Quiterianópolis', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Quiterianópolis / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311264' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311264', 'Quiterianópolis', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Quiterianópolis', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Quiterianópolis / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311264' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311306', 'Quixadá', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Quixadá', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Quixadá / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311306' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311306', 'Quixadá', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Quixadá', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Quixadá / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311306' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311306', 'Quixadá', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Quixadá', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Quixadá / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311306' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311355', 'Quixelô', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Quixelô', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Quixelô / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311355' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311355', 'Quixelô', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Quixelô', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Quixelô / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311355' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311355', 'Quixelô', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Quixelô', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Quixelô / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311355' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311405', 'Quixeramobim', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Quixeramobim', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Quixeramobim / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311405' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311405', 'Quixeramobim', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Quixeramobim', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Quixeramobim / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311405' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311405', 'Quixeramobim', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Quixeramobim', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Quixeramobim / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311405' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311504', 'Quixeré', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Quixeré', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Quixeré / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311504' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311504', 'Quixeré', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Quixeré', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Quixeré / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311504' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311504', 'Quixeré', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Quixeré', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Quixeré / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311504' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311603', 'Redenção', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Redenção', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Redenção / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311603' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311603', 'Redenção', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Redenção', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Redenção / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311603' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311603', 'Redenção', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Redenção', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Redenção / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311603' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311702', 'Reriutaba', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Reriutaba', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Reriutaba / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311702' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311702', 'Reriutaba', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Reriutaba', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Reriutaba / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311702' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311702', 'Reriutaba', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Reriutaba', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Reriutaba / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311702' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311801', 'Russas', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Russas', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Russas / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311801' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311801', 'Russas', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Russas', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Russas / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311801' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311801', 'Russas', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Russas', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Russas / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311801' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311900', 'Saboeiro', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Saboeiro', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Saboeiro / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311900' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311900', 'Saboeiro', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Saboeiro', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Saboeiro / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311900' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311900', 'Saboeiro', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Saboeiro', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Saboeiro / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311900' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311959', 'Salitre', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Salitre', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Salitre / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311959' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311959', 'Salitre', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Salitre', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Salitre / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311959' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2311959', 'Salitre', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Salitre', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Salitre / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2311959' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312205', 'Santa Quitéria', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Santa Quitéria', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Santa Quitéria / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312205' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312205', 'Santa Quitéria', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Santa Quitéria', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Santa Quitéria / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312205' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312205', 'Santa Quitéria', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Santa Quitéria', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Santa Quitéria / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312205' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312007', 'Santana do Acaraú', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Santana do Acaraú', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Santana do Acaraú / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312007' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312007', 'Santana do Acaraú', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Santana do Acaraú', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Santana do Acaraú / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312007' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312007', 'Santana do Acaraú', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Santana do Acaraú', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Santana do Acaraú / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312007' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312106', 'Santana do Cariri', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Santana do Cariri', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Santana do Cariri / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312106' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312106', 'Santana do Cariri', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Santana do Cariri', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Santana do Cariri / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312106' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312106', 'Santana do Cariri', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Santana do Cariri', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Santana do Cariri / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312106' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312304', 'São Benedito', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - São Benedito', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de São Benedito / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312304' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312304', 'São Benedito', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - São Benedito', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de São Benedito / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312304' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312304', 'São Benedito', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - São Benedito', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de São Benedito / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312304' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312403', 'São Gonçalo do Amarante', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - São Gonçalo do Amarante', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de São Gonçalo do Amarante / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312403' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312403', 'São Gonçalo do Amarante', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - São Gonçalo do Amarante', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de São Gonçalo do Amarante / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312403' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312403', 'São Gonçalo do Amarante', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - São Gonçalo do Amarante', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de São Gonçalo do Amarante / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312403' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312502', 'São João do Jaguaribe', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - São João do Jaguaribe', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de São João do Jaguaribe / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312502' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312502', 'São João do Jaguaribe', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - São João do Jaguaribe', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de São João do Jaguaribe / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312502' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312502', 'São João do Jaguaribe', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - São João do Jaguaribe', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de São João do Jaguaribe / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312502' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312601', 'São Luís do Curu', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - São Luís do Curu', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de São Luís do Curu / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312601' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312601', 'São Luís do Curu', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - São Luís do Curu', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de São Luís do Curu / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312601' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312601', 'São Luís do Curu', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - São Luís do Curu', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de São Luís do Curu / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312601' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312700', 'Senador Pompeu', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Senador Pompeu', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Senador Pompeu / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312700' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312700', 'Senador Pompeu', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Senador Pompeu', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Senador Pompeu / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312700' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312700', 'Senador Pompeu', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Senador Pompeu', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Senador Pompeu / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312700' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312809', 'Senador Sá', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Senador Sá', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Senador Sá / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312809' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312809', 'Senador Sá', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Senador Sá', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Senador Sá / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312809' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312809', 'Senador Sá', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Senador Sá', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Senador Sá / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312809' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312908', 'Sobral', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Sobral', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Sobral / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312908' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312908', 'Sobral', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Sobral', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Sobral / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312908' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2312908', 'Sobral', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Sobral', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Sobral / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2312908' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313005', 'Solonópole', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Solonópole', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Solonópole / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313005' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313005', 'Solonópole', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Solonópole', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Solonópole / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313005' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313005', 'Solonópole', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Solonópole', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Solonópole / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313005' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313104', 'Tabuleiro do Norte', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Tabuleiro do Norte', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Tabuleiro do Norte / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313104' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313104', 'Tabuleiro do Norte', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Tabuleiro do Norte', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Tabuleiro do Norte / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313104' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313104', 'Tabuleiro do Norte', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Tabuleiro do Norte', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Tabuleiro do Norte / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313104' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313203', 'Tamboril', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Tamboril', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Tamboril / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313203' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313203', 'Tamboril', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Tamboril', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Tamboril / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313203' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313203', 'Tamboril', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Tamboril', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Tamboril / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313203' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313252', 'Tarrafas', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Tarrafas', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Tarrafas / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313252' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313252', 'Tarrafas', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Tarrafas', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Tarrafas / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313252' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313252', 'Tarrafas', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Tarrafas', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Tarrafas / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313252' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313302', 'Tauá', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Tauá', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Tauá / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313302' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313302', 'Tauá', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Tauá', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Tauá / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313302' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313302', 'Tauá', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Tauá', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Tauá / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313302' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313351', 'Tejuçuoca', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Tejuçuoca', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Tejuçuoca / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313351' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313351', 'Tejuçuoca', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Tejuçuoca', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Tejuçuoca / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313351' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313351', 'Tejuçuoca', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Tejuçuoca', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Tejuçuoca / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313351' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313401', 'Tianguá', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Tianguá', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Tianguá / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313401' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313401', 'Tianguá', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Tianguá', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Tianguá / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313401' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313401', 'Tianguá', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Tianguá', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Tianguá / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313401' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313500', 'Trairi', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Trairi', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Trairi / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313500' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313500', 'Trairi', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Trairi', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Trairi / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313500' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313500', 'Trairi', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Trairi', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Trairi / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313500' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313559', 'Tururu', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Tururu', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Tururu / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313559' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313559', 'Tururu', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Tururu', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Tururu / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313559' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313559', 'Tururu', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Tururu', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Tururu / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313559' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313609', 'Ubajara', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Ubajara', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Ubajara / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313609' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313609', 'Ubajara', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Ubajara', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Ubajara / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313609' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313609', 'Ubajara', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Ubajara', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Ubajara / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313609' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313708', 'Umari', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Umari', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Umari / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313708' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313708', 'Umari', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Umari', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Umari / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313708' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313708', 'Umari', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Umari', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Umari / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313708' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313757', 'Umirim', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Umirim', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Umirim / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313757' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313757', 'Umirim', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Umirim', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Umirim / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313757' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313757', 'Umirim', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Umirim', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Umirim / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313757' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313807', 'Uruburetama', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Uruburetama', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Uruburetama / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313807' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313807', 'Uruburetama', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Uruburetama', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Uruburetama / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313807' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313807', 'Uruburetama', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Uruburetama', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Uruburetama / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313807' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313906', 'Uruoca', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Uruoca', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Uruoca / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313906' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313906', 'Uruoca', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Uruoca', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Uruoca / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313906' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313906', 'Uruoca', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Uruoca', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Uruoca / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313906' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313955', 'Varjota', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Varjota', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Varjota / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313955' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313955', 'Varjota', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Varjota', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Varjota / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313955' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2313955', 'Varjota', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Varjota', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Varjota / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2313955' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2314003', 'Várzea Alegre', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Várzea Alegre', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Várzea Alegre / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2314003' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2314003', 'Várzea Alegre', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Várzea Alegre', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Várzea Alegre / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2314003' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2314003', 'Várzea Alegre', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Várzea Alegre', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Várzea Alegre / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2314003' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2314102', 'Viçosa do Ceará', 'Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - Viçosa do Ceará', 'Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de Viçosa do Ceará / CE.', 'infraestrutura', ARRAY['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades']::text[], 'Ministério das Cidades', 'edital_federal', 1850000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2314102' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2314102', 'Viçosa do Ceará', 'Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - Viçosa do Ceará', 'Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de Viçosa do Ceará / CE.', 'infraestrutura', ARRAY['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte']::text[], 'Ministério da Integração e do Desenvolvimento Regional', 'edital_federal', 620000, 'mapeada', 'alta'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2314102' AND ma.role_type = 'prefeito'
          LIMIT 1
        
UNION ALL

          SELECT ma.id, '2314102', 'Viçosa do Ceará', 'Reforma e Ampliação da Unidade Básica de Saúde (UBS) - Viçosa do Ceará', 'Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de Viçosa do Ceará / CE.', 'saúde', ARRAY['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina']::text[], 'Ministério da Saúde', 'edital_federal', 450000, 'mapeada', 'urgente'
          FROM municipal_authorities ma
          WHERE ma.municipality_ibge = '2314102' AND ma.role_type = 'prefeito'
          LIMIT 1
        
ON CONFLICT DO NOTHING;

-- 3. Matchmaking inicial automático entre Editais Abertos e Prefeitos do Ceará
INSERT INTO edital_authority_tracking (
  edital_id,
  authority_id,
  demand_id,
  match_score,
  match_reasons,
  tracking_status,
  updated_at
)
SELECT DISTINCT ON (e.id, ma.id)
  e.id AS edital_id,
  ma.id AS authority_id,
  d.id AS demand_id,
  CASE
    WHEN d.id IS NOT NULL AND e.categoria_tematica = d.category THEN 88
    WHEN e.uf = 'CE' OR e.abrangencia = 'CE' THEN 75
    WHEN e.elegivel_prefeituras = true THEN 65
    ELSE 50
  END AS match_score,
  jsonb_build_array(
    CASE
      WHEN d.id IS NOT NULL THEN 'Compatível com a demanda: ' || d.title
      ELSE 'Área prioritária municipal de ' || ma.municipality_name
    END,
    CASE
      WHEN e.uf = 'CE' THEN 'Edital de abrangência estadual no Ceará'
      ELSE 'Oportunidade federal elegível para prefeituras (' || COALESCE(e.ministerio, e.orgao) || ')'
    END
  ) AS match_reasons,
  'sugerido' AS tracking_status,
  NOW() AS updated_at
FROM editais e
CROSS JOIN municipal_authorities ma
LEFT JOIN authority_demands d
  ON d.authority_id = ma.id
 AND (d.category = e.categoria_tematica OR e.categoria_tematica = ANY(ma.priority_areas))
WHERE e.situacao = 'aberto'
  AND ma.active = true
  AND (
    e.uf = 'CE'
    OR e.elegivel_prefeituras = true
    OR e.categoria_tematica = ANY(ma.priority_areas)
    OR d.id IS NOT NULL
  )
ON CONFLICT (edital_id, authority_id) DO UPDATE SET
  match_score = GREATEST(edital_authority_tracking.match_score, EXCLUDED.match_score),
  match_reasons = EXCLUDED.match_reasons,
  updated_at = NOW();
