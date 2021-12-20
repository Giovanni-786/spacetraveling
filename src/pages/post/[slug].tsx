import { GetStaticPaths, GetStaticProps } from 'next';
import { getPrismicClient } from '../../services/prismic';
import { FiCalendar,FiUser,FiClock } from "react-icons/fi";

import styles from './post.module.scss';


import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import React from 'react';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';


interface Post {
  first_publication: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({post}: PostProps) {

  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

//contagem de palavras
const amountWordsOfBody = RichText.asText(
  post.data.content.reduce((acc, data) => [...acc, ...data.body], [])
).split(' ').length;

const amountWordsOfHeading = post.data.content.reduce((acc, data) => {
  if (data.heading) {
    return [...acc, ...data.heading.split(' ')];
  }

  return [...acc];
}, []).length;

//tempo de leitura em min
const readingTime = Math.ceil(
  (amountWordsOfBody + amountWordsOfHeading) / 200
);

let iconStyles = { marginRight: '0.3rem'};

  return (
    <>
    <main className={styles.container_banner}>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="banner post" />
      </div>
    </main>

    <main className={styles.container_title}>
    <h1>{post.data.title}</h1>
      <div className={styles.info}>
        <p> <FiUser style={iconStyles} />{post.data.author}</p>
        <p><FiCalendar style={iconStyles} /> {post.first_publication}</p>
        <p> <FiClock style={iconStyles} />{readingTime} min</p>
      </div>
    </main>

    <main className={styles.container_content}>
      {post.data.content.map(content => {

        return(
        <>
        <div className={styles.content}>
          <h2>{content.heading}</h2>  
          {content.body.map(body => {
            return(
            <div className={styles.container_body_text}>
              <p>{body.text}</p>
            </div>
            );
          })}
        </div>
        </>
        )
      })}
    </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    { pageSize: 3 }
  );

  const paths = posts.results.map(result => {
    return {
      params: {
        slug: result.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};


export const getStaticProps = async({ params }) => {
  const { slug } = params;
  
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    slug,
    first_publication: format(new Date(response.first_publication_date), "dd MMM yyyy", {
      locale: ptBR
    }),
    ...response
  }
  
  return {
    props: {
        post
    },
    revalidate: 60 * 30, // 30 minutes
}

};
